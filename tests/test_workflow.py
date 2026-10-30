import os
import tempfile
os.environ['DATABASE_URL']='sqlite:///'+tempfile.mktemp(suffix='.db')
os.environ.pop('NEBIUS_API_KEY',None)
os.environ.pop('OWNER_TOKEN',None)
from fastapi.testclient import TestClient
from backend.main import app
from backend import store
from backend.evaluation import artifact_hash
from backend.contracts import FormSpec
import pytest

client=TestClient(app)

@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv('NEBIUS_API_KEY',raising=False)
    monkeypatch.delenv('OWNER_TOKEN',raising=False)
    store.Base.metadata.drop_all(store.engine)
    store.Base.metadata.create_all(store.engine)

def published():
    response=client.post('/api/forms',json={'brief':'Ask what was completed and what held up work.'})
    assert response.status_code==200,response.text
    data=response.json(); p=data['proposal']
    assert client.post(f"/api/proposals/{p['id']}/publish",json={'artifact_hash':p['hash']}).status_code==409
    assert client.post(f"/api/proposals/{p['id']}/evaluate").json()['passed']
    release=client.post(f"/api/proposals/{p['id']}/publish",json={'artifact_hash':p['hash']})
    assert release.status_code==200,release.text
    return data['form'],release.json()

def start(form):
    return client.post('/api/sessions',json={'form_id':form['id']}).json()

def fill(session,exception=''):
    note="Finished prep. Wrong tiles arrived. Need replacements tomorrow."
    result=client.post(f"/api/sessions/{session['id']}/interpret",json={'note':note}).json()['interpretation']
    response=client.put(f"/api/sessions/{session['id']}",json={'site':'Elm House','day':'2026-10-30','worker':'Sam','note':note,'interpretation':result,'arranged':'no','exception':exception})
    assert response.status_code==200,response.text


def test_full_loop_pins_sessions_enforces_evidence_and_rollback():
    form,v1=published(); old=start(form); fill(old)
    assert client.post(f"/api/sessions/{old['id']}/submit").status_code==200
    p=client.post(f"/api/forms/{form['id']}/proposals",json={'feedback':'Ask for a photo when wrong materials arrive.'}).json()
    client.post(f"/api/proposals/{p['id']}/evaluate")
    assert client.post(f"/api/proposals/{p['id']}/publish",json={'artifact_hash':'invalid'}).status_code==409
    v2=client.post(f"/api/proposals/{p['id']}/publish",json={'artifact_hash':p['hash']}).json()
    assert v2['number']==2
    assert client.get(f"/api/sessions/{old['id']}").json()['version']==1
    new=start(form); fill(new)
    assert client.post(f"/api/sessions/{new['id']}/submit").status_code==422
    fill(new,'Packaging was discarded before the update.')
    submitted=client.post(f"/api/sessions/{new['id']}/submit").json()
    assert submitted['review_required']
    assert client.post(f"/api/sessions/{new['id']}/submit").json()['id']==submitted['id']
    assert client.post(f"/api/sessions/{new['id']}/interpret",json={'note':'Change the report'}).status_code==409
    assert client.post(f"/api/forms/{form['id']}/rollback/{v1['id']}").status_code==200
    assert start(form)['version']==1
    assert client.get(f"/api/sessions/{new['id']}").json()['version']==2


def test_stale_proposal_cannot_overwrite_new_release():
    form,_=published()
    ps=[client.post(f"/api/forms/{form['id']}/proposals",json={'feedback':'Add a delivery photo check.'}).json() for _ in range(2)]
    for p in ps: client.post(f"/api/proposals/{p['id']}/evaluate")
    assert client.post(f"/api/proposals/{ps[0]['id']}/publish",json={'artifact_hash':ps[0]['hash']}).status_code==200
    assert client.post(f"/api/proposals/{ps[1]['id']}/publish",json={'artifact_hash':ps[1]['hash']}).status_code==409


def test_upload_rejects_fake_image_and_retains_pending_real_image():
    import io
    from PIL import Image
    form,_=published(); session=start(form)
    endpoint=f"/api/sessions/{session['id']}/photo"
    assert client.post(endpoint,files={'file':('photo.jpg',b'not an image','image/jpeg')}).status_code==422
    image=Image.new('RGB',(200,200)); buffer=io.BytesIO(); image.save(buffer,format='PNG')
    result=client.post(endpoint,files={'file':('photo.png',buffer.getvalue(),'image/png')})
    assert result.status_code==200
    assert result.json()['observation']['status']=='review'


def test_owner_auth_and_changed_transcript(monkeypatch):
    form,_=published(); session=start(form); fill(session)
    payload=client.get(f"/api/sessions/{session['id']}").json()['answers']; payload['note']='Different report'
    assert client.put(f"/api/sessions/{session['id']}",json=payload).status_code==409
    monkeypatch.setenv('OWNER_TOKEN','test-owner-token')
    assert client.get('/api/workspace').status_code==401
    assert client.get('/api/workspace',headers={'Authorization':'Bearer test-owner-token'}).status_code==200
