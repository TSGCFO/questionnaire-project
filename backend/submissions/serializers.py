from rest_framework import serializers
from .models import QuestionnaireSubmission

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionnaireSubmission
        fields = ['id', 'email', 'submission_date', 'data']
        read_only_fields = ['submission_date']
