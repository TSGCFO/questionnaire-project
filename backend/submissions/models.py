# submissions/models.py
from django.db import models

class QuestionnaireSubmission(models.Model):
    email = models.EmailField(help_text="Email of the person submitting the questionnaire")
    submission_date = models.DateTimeField(auto_now_add=True, help_text="Date and time of submission")
    data = models.JSONField(help_text="The questionnaire data in JSON format")
    file = models.FileField(upload_to='questionnaires/', null=True, blank=True, 
                           help_text="The original Excel questionnaire file")
    
    def __str__(self):
        return f"Submission from {self.email} on {self.submission_date}"
    
    class Meta:
        ordering = ['-submission_date']
        verbose_name = "Questionnaire Submission"
        verbose_name_plural = "Questionnaire Submissions"