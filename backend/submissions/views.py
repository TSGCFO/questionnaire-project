from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import QuestionnaireSubmission
from .serializers import SubmissionSerializer
from django.core.mail import EmailMessage
import json
import logging

# Set up logging
logger = logging.getLogger(__name__)

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
            subject = f'New Questionnaire Submission from {email}: ID {submission.id}'
            body = f'A new questionnaire has been submitted.\n\n' \
                   f'From: {email}\n' \
                   f'Submission ID: {submission.id}\n' \
                   f'Date: {submission.submission_date}\n\n'
                   
            # Add explanation about attachment or data
            if submission.file:
                body += 'Please find the original questionnaire attached.'
            else:
                body += 'The submitted data is:\n\n' + json.dumps(questionnaire_data, indent=2)
            
            # List of all recipients
            recipient_list = [
                '32688c60.tsgfulfillment.com@ca.teams.ms',  # Sales - TSG Fulfillment Business development
                'roger.gavinho@tsgfulfillment.com',
                'navi@tsgfulfillment.com',
                'ZeeKhan@tsgfulfillment.com',
                'zeeshan@tsgfulfillment.com'
            ]
            
            # Create email message
            email_message = EmailMessage(
                subject=subject,
                body=body,
                from_email='info@tsgfulfillment.com',
                to=recipient_list,
                reply_to=[email]  # Set reply-to as the customer's email
            )
            
            # Attach the file if we have it
            if submission.file:
                email_message.attach_file(submission.file.path)
            
            # Send email
            email_message.send()
            
            logger.info(f"Questionnaire submission {submission.id} from {email} processed successfully")
            
            # Return success response
            return Response({
                "message": "Submission successful",
                "id": submission.id
            }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            # Log the error for debugging
            logger.error(f"Error processing questionnaire submission: {str(e)}")
            
            # Return error message
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)