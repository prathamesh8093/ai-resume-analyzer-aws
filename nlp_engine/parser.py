import os
import re
import sys
import json
import boto3
from PyPDF2 import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Predefined Job Profiles and Skill DB for matching
JOB_PROFILES = {
    "AWS Cloud Engineer": [
        "aws", "s3", "ec2", "lambda", "dynamodb", "iam", "cloudwatch", 
        "docker", "kubernetes", "python", "linux", "terraform", "cicd"
    ],
    "Frontend Developer": [
        "react", "javascript", "typescript", "html", "css", "tailwind", 
        "redux", "nextjs", "git", "rest api", "webpack"
    ],
    "Node.js Backend Developer": [
        "node", "express", "javascript", "mongodb", "postgresql", 
        "aws", "docker", "rest api", "jwt", "git", "redis"
    ]
}

# Expanded Action Verbs for ATS Analysis
ACTION_VERBS = [
    "built", "developed", "architected", "engineered", "implemented", 
    "designed", "optimized", "deployed", "automated", "orchestrated", "led"
]

REQUIRED_SECTIONS = ["experience", "education", "skills", "projects"]

def analyze_ats_friendliness(resume_text):
    text_lower = resume_text.lower()
    
    # 1. Section Header Checks
    found_sections = [sec for sec in REQUIRED_SECTIONS if sec in text_lower]
    missing_sections = [sec for sec in REQUIRED_SECTIONS if sec not in found_sections]
    section_score = (len(found_sections) / len(REQUIRED_SECTIONS)) * 100
    
    # 2. Action Verb Count
    found_verbs = [verb for verb in ACTION_VERBS if verb in text_lower]
    verb_score = min(100, (len(found_verbs) / 5) * 100) # Expecting at least 5 strong action verbs
    
    # Overall ATS Health Score
    ats_score = round((section_score * 0.6) + (verb_score * 0.4), 2)
    
    return {
        "atsHealthScore": ats_score,
        "foundSections": found_sections,
        "missingSections": missing_sections,
        "actionVerbsUsed": found_verbs
    }
    
def extract_text_from_pdf(pdf_path):
    """Extract raw text from PDF resume using PyPDF2."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + " "
    return text.lower()

def analyze_resume(resume_text, target_role="AWS Cloud Engineer"):
    """Perform NLP matching & skill gap analysis."""
    required_skills = JOB_PROFILES.get(target_role, JOB_PROFILES["AWS Cloud Engineer"])
    
    # Extract matched & missing skills
    matched_skills = [skill for skill in required_skills if re.search(r'\b' + re.escape(skill) + r'\b', resume_text)]
    missing_skills = [skill for skill in required_skills if skill not in matched_skills]
    
    # TF-IDF & Cosine Similarity Calculation
    job_profile_text = " ".join(required_skills)
    documents = [resume_text, job_profile_text]
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)
    
    similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    final_score = round(float(similarity_score) * 100, 2)
    
    # Normalize score if skills were matched via regex
    if len(matched_skills) > 0 and final_score < 30:
        final_score = round((len(matched_skills) / len(required_skills)) * 100, 2)

    return {
        "score": final_score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "targetRole": target_role
    }

def save_to_dynamodb(resume_id, analysis_result):
    """Save analysis results directly to AWS DynamoDB using boto3."""
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.getenv('AWS_REGION', 'ap-south-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME', 'ResumeScores'))
    
    table.put_item(
        Item={
            'resumeId': resume_id,
            'score': str(analysis_result['score']),
            'matchedSkills': analysis_result['matchedSkills'],
            'missingSkills': analysis_result['missingSkills'],
            'targetRole': analysis_result['targetRole']
        }
    )
    print(f"Successfully saved results to AWS DynamoDB for resumeId: {resume_id}")

if __name__ == "__main__":
    # Test runner for command-line verification
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        test_id = sys.argv[2] if len(sys.argv) > 2 else "test-resume-101"
        target_role = sys.argv[3] if len(sys.argv) > 3 else "AWS Cloud Engineer"
        
        print(f"Parsing PDF: {file_path}...")
        parsed_text = extract_text_from_pdf(file_path)
        result = analyze_resume(parsed_text, target_role)
        
        print("\n--- NLP Analysis Results ---")
        print(json.dumps(result, indent=2))
        
        save_to_dynamodb(test_id, result)
    else:
        print("Usage: python parser.py <path_to_pdf> <resume_id> <target_role>")