from django.urls import path
from .views import SubmissionView

urlpatterns = [
    path('submit/', SubmissionView.as_view(), name='submit-questionnaire'),
]
