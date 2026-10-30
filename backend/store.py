import os
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import create_engine, String, JSON, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

Path('.data').mkdir(exist_ok=True)
url = os.getenv('DATABASE_URL', 'sqlite:///.data/fieldnote.db')
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql+psycopg://', 1)
if url.startswith('postgresql://'):
    url = url.replace('postgresql://', 'postgresql+psycopg://', 1)
engine = create_engine(url, connect_args={'check_same_thread': False} if url.startswith('sqlite') else {}, pool_pre_ping=True)

class Base(DeclarativeBase):
    pass

class Record(Base):
    __tablename__ = 'records'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created: Mapped[str] = mapped_column(String(40))

Session = sessionmaker(engine, expire_on_commit=False)

def now():
    return datetime.now(timezone.utc).isoformat()

def create(db, kind, data, id=None):
    record = Record(id=id or uuid4().hex, kind=kind, data=data, created=now())
    db.add(record)
    db.flush()
    return record

def serial(record):
    return {'id': record.id, 'created': record.created, **record.data}

def records(db, kind):
    return db.scalars(select(Record).where(Record.kind == kind).order_by(Record.created.desc())).all()
