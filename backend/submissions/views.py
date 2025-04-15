from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import QuestionnaireSubmission
from .serializers import SubmissionSerializer
from django.core.mail import EmailMessage
import json

class SubmissionView(APIView):
    """
    API view to handle questionnaire submissions with file attachments.
    Accepts POST requests with questionnaire data and optional file uploads.
    """
    # Add these parsers to handle both JSON and file uploads
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def post(self, request):
        try:
            # Extract data from request
            email = request.data.get('email', 'anonymous@submission.com')
            questionnaire_data = request.data.get('questionnaire_data')
            
            # Handle the questionnaire data which might be a JSON string
            if isinstance(questionnaire_data, str):
                try:
                    questionnaire_data = json.loads(questionnaire_data)
                except json.JSONDecodeError:
                    return Response({"error": "Invalid JSON data"}, 
                                   status=status.HTTP_400_BAD_REQUEST)
            
            # Create submission object
            submission = QuestionnaireSubmission(
                email=email,
                data=questionnaire_data
            )
            
            # Handle file upload if present
            excel_file = request.FILES.get('file')
            if excel_file:
                submission.file = excel_file
            
            # Save submission to database
            submission.save()
            
            # Prepare email with attachment
            subject = f'New Questionnaire Submission: {submission.id}'
            body = f'A new questionnaire has been submitted.\n\n' \
                   f'From: {email}\n' \
                   f'Submission ID: {submission.id}\n' \
                   f'Date: {submission.submission_date}\n\n'
                   
            # Add explanation about attachment or data
            if submission.file:
                body += 'Please find the original questionnaire attached.'
            else:
                body += 'The submitted data is:\n\n' + json.dumps(questionnaire_data, indent=2)
            
            # Create email message
            email_message = EmailMessage(
                subject=subject,
                body=body,
                to=['h.sadiq@tsgfulfillment.com']
            )
            
            # Attach the file if we have it
            if submission.file:
                email_message.attach_file(submission.file.path)
            
            # Send email
            email_message.send()
            
            # Return success response
            return Response({
                "message": "Submission successful",
                "id": submission.id
            }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            # Return error message
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)