"""Vetted, editable starter contracts; every catalog choice runs the same typed runtime."""

from .contracts import FormSpec, FollowUpRule


def make(
    id, title, category, context, choices, prompt, branch, trigger="negative_feedback"
):
    course = id != "daily-site"
    spec = FormSpec(
        template_id=id,
        title=title,
        description="A short conversation that asks for the details that matter.",
        context_label=context,
        sites=choices,
        note_prompt=prompt,
        completed_label="What worked / key details" if course else "Work completed",
        blocker_label="Concern or friction" if course else "What held things up?",
        next_action_label="Requested next step" if course else "What do you need next?",
        blocker_question="Would you like someone to follow up with you?"
        if course
        else "Has someone arranged what you need next?",
        follow_up_rules=[
            FollowUpRule(id="context-detail", trigger=trigger, question=branch)
        ]
        if branch
        else [],
    )
    return {
        "id": id,
        "name": title,
        "category": category,
        "description": prompt,
        "brief": prompt
        + " Keep the form concise and adapt follow-ups to what the respondent says.",
        "spec": spec.model_dump(),
    }


TEMPLATES = [
    make(
        "daily-site",
        "Daily site report",
        "Operations",
        "Site",
        ["Elm House", "Oak Avenue", "Park Road"],
        "What did you finish, what held you up, and what do you need tomorrow?",
        "",
    ),
    make(
        "course-feedback",
        "End-of-course feedback",
        "Education",
        "Course",
        ["AI Foundations", "Leadership workshop", "Customer service"],
        "What worked well in the course, what did not, and what would you change?",
        "Which part of the course caused the difficulty?",
    ),
    make(
        "product-feedback",
        "Product feedback",
        "Research",
        "Product",
        ["Mobile app", "Web app", "New prototype"],
        "Tell us about your experience with the product. What was useful, frustrating, or missing?",
        "What were you trying to do when the problem occurred?",
    ),
    make(
        "service-feedback",
        "Service experience",
        "Customer experience",
        "Service",
        ["In-store visit", "Online order", "Phone support"],
        "How was your experience with our service, and what could we improve?",
        "Which part of the service disappointed you?",
    ),
    make(
        "booking-request",
        "Booking enquiry",
        "Bookings",
        "Service",
        ["Consultation", "Workshop", "Site visit"],
        "Describe what you would like to book, your preferred time, and any special requirements.",
        "What time window and group size would work for you?",
        "request",
    ),
    make(
        "market-research",
        "Market research interview",
        "Research",
        "Study",
        ["Buying habits", "Concept test", "Brand perception"],
        "Tell us how you currently solve this problem and what is frustrating about the process.",
        "Can you describe the most recent time you experienced that frustration?",
    ),
    make(
        "mystery-shopping",
        "Mystery shopping visit",
        "Retail",
        "Store",
        ["High Street", "Shopping centre", "Online store"],
        "Describe your visit: staff interaction, availability, checkout, and anything that fell short.",
        "Where in the customer journey did the experience fall short?",
    ),
    make(
        "visual-audit",
        "Visual merchandising audit",
        "Retail",
        "Location",
        ["Flagship store", "Neighbourhood store", "Pop-up"],
        "Describe the display, availability, signage and any issues you noticed.",
        "Which display or location needs attention?",
        "other",
    ),
    make(
        "event-feedback",
        "Event feedback",
        "Events",
        "Event",
        ["Community meetup", "Product launch", "Conference"],
        "What did you enjoy about the event, and what would make the next one better?",
        "Which part of the event needs improvement?",
    ),
    make(
        "customer-onboarding",
        "Customer onboarding",
        "Customer success",
        "Product",
        ["Starter plan", "Team plan", "Enterprise pilot"],
        "Tell us your goal, current process, and what you need help getting started with.",
        "What outcome would make this onboarding successful?",
        "request",
    ),
    make(
        "support-intake",
        "Support intake",
        "Customer support",
        "Area",
        ["Account", "Payments", "Product"],
        "Describe the problem, what you were trying to do, and the help you need.",
        "What happened immediately before you noticed the problem?",
        "other",
    ),
    make(
        "property-visit",
        "Property visit report",
        "Property",
        "Property",
        ["Apartment A", "House B", "Commercial unit"],
        "Describe the condition, completed checks, issues and recommended next actions.",
        "Which part of the property is affected?",
        "other",
    ),
    make(
        "volunteer-intake",
        "Volunteer application",
        "Community",
        "Programme",
        ["Community kitchen", "Mentoring", "Local events"],
        "Tell us your interests, relevant experience, availability and the role you would like.",
        "What availability or support would help you take part?",
        "request",
    ),
    make(
        "delivery-report",
        "Delivery experience",
        "Logistics",
        "Delivery",
        ["Local delivery", "Courier delivery", "Collection"],
        "Describe what arrived, whether it met expectations and any issue needing attention.",
        "Which item or part of the delivery needs attention?",
        "wrong_material",
    ),
    make(
        "employee-pulse",
        "Team pulse survey",
        "People",
        "Team",
        ["Operations", "Customer team", "Product team"],
        "How has your week been? What is working well and what is making work harder?",
        "What is the main source of friction this week?",
    ),
]


def template(id):
    found = next((t for t in TEMPLATES if t["id"] == id), None)
    if found is None:
        raise ValueError("Choose a supported starter template")
    return FormSpec.model_validate(found["spec"])
