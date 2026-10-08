const express = require("express");
const cors = require("cors");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { s3Client, docClient } = require("./awsConfig");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 1. Endpoint: Generate S3 Pre-Signed Upload URL
app.post("/api/get-presigned-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const key = `resumes/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate Pre-Signed URL valid for 5 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    res.json({
      uploadUrl: signedUrl,
      fileKey: key,
    });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// 2. Endpoint: Save Analysis Results to DynamoDB
app.post("/api/save-score", async (req, res) => {
  try {
    const { resumeId, score, matchedSkills, missingSkills, targetRole } = req.body;

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: {
        resumeId,
        score,
        matchedSkills,
        missingSkills,
        targetRole,
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    res.json({ message: "Analysis saved successfully!", resumeId });
  } catch (error) {
    console.error("Error saving to DynamoDB:", error);
    res.status(500).json({ error: "Failed to save analysis to database" });
  }
});

// 3. Endpoint: Fetch Resume Score from DynamoDB
app.get("/api/get-score/:resumeId", async (req, res) => {
  try {
    const { resumeId } = req.params;

    const command = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { resumeId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(response.Item);
  } catch (error) {
    console.error("Error fetching from DynamoDB:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

app.listen(PORT, () => {
  console.log(`Node.js Express Backend running on http://localhost:${PORT}`);
});

const axios = require("axios");

// Endpoint: Fetch Live Jobs Matching Target Role
// Endpoint: Fetch Live Jobs Matching Target Role (With Fallback)
// Endpoint: Fetch Live Jobs with Direct Application Link Resolution
// Endpoint: Domain-Specific Companies with Direct Official Apply Portals
app.get("/api/get-live-jobs", async (req, res) => {
  const { role = "AWS Cloud Engineer", location = "India" } = req.query;

  // Domain-Specific Company Database with Official Career Search URLs
  const DOMAIN_COMPANY_MATRIX = {
    "AWS Cloud Engineer": [
      {
        jobId: "aws-1",
        title: "AWS Cloud Solutions Architect",
        company: "Amazon Web Services (AWS)",
        location: "Bengaluru, India (Hybrid)",
        applyLink: "https://www.amazon.jobs/en/search?base_query=Cloud+Engineer&loc_query=India",
        isRemote: false
      },
      {
        jobId: "aws-2",
        title: "Cloud Infrastructure Specialist",
        company: "Accenture",
        location: "Mumbai, India (Remote)",
        applyLink: "https://www.accenture.com/in-en/careers/jobsearch?jk=AWS%20Cloud",
        isRemote: true
      },
      {
        jobId: "aws-3",
        title: "Senior DevOps & Cloud Engineer",
        company: "Tata Consultancy Services (TCS)",
        location: "Pune, India",
        applyLink: "https://www.tcs.com/careers",
        isRemote: false
      },
      {
        jobId: "aws-4",
        title: "Cloud Migration Engineer",
        company: "Cognizant",
        location: "Chennai, India",
        applyLink: "https://careers.cognizant.com/global/en/search-results?keywords=Cloud%20Engineer",
        isRemote: false
      },
      {
        jobId: "aws-5",
        title: "AWS DevOps Consultant",
        company: "Capgemini",
        location: "Hyderabad, India (Remote)",
        applyLink: "https://www.capgemini.com/in-en/careers/",
        isRemote: true
      }
    ],
    "Frontend Developer": [
      {
        jobId: "fe-1",
        title: "Senior React UI Developer",
        company: "Microsoft",
        location: "Hyderabad, India (Hybrid)",
        applyLink: "https://jobs.careers.microsoft.com/global/en/search?q=Frontend%20Developer&lc=India",
        isRemote: false
      },
      {
        jobId: "fe-2",
        title: "Frontend Engineer (React / Tailwind)",
        company: "Infosys",
        location: "Bengaluru, India (Remote)",
        applyLink: "https://www.infosys.com/careers.html",
        isRemote: true
      },
      {
        jobId: "fe-3",
        title: "UI/UX Software Engineer",
        company: "Wipro",
        location: "Pune, India",
        applyLink: "https://careers.wipro.com/careers-home/",
        isRemote: false
      },
      {
        jobId: "fe-4",
        title: "Lead Web Applications Developer",
        company: "Accenture",
        location: "Gurugram, India",
        applyLink: "https://www.accenture.com/in-en/careers/jobsearch?jk=Frontend%20Developer",
        isRemote: true
      }
    ],
    "Node.js Backend Developer": [
      {
        jobId: "be-1",
        title: "Software Engineer - Node.js Services",
        company: "Google",
        location: "Bengaluru, India",
        applyLink: "https://www.google.com/about/careers/applications/jobs/results/?q=Backend%20Engineer&location=India",
        isRemote: false
      },
      {
        jobId: "be-2",
        title: "Backend Microservices Developer",
        company: "Tata Consultancy Services (TCS)",
        location: "Mumbai, India",
        applyLink: "https://www.tcs.com/careers",
        isRemote: false
      },
      {
        jobId: "be-3",
        title: "Node.js & Cloud API Architect",
        company: "Cognizant",
        location: "Kolkata, India (Remote)",
        applyLink: "https://careers.cognizant.com/global/en/search-results?keywords=Node.js",
        isRemote: true
      },
      {
        jobId: "be-4",
        title: "Full Stack / Backend Engineer",
        company: "Capgemini",
        location: "Noida, India",
        applyLink: "https://www.capgemini.com/in-en/careers/",
        isRemote: false
      }
    ]
  };

  try {
    // Select matched domain dataset or fall back to AWS Cloud Engineer
    const domainJobs = DOMAIN_COMPANY_MATRIX[role] || DOMAIN_COMPANY_MATRIX["AWS Cloud Engineer"];

    // If RapidAPI key is set and valid, attempt live search fallback
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== "YOUR_RAPIDAPI_KEY_HERE") {
      try {
        const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
          params: { query: `${role} in ${location}`, page: "1", num_pages: "1" },
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
          },
          timeout: 3000
        });

        if (response.data?.data?.length > 0) {
          const liveJobs = response.data.data.map((job) => {
            const directOpt = job.apply_options?.find((opt) => opt.is_direct === true) || job.apply_options?.[0];
            return {
              jobId: job.job_id,
              title: job.job_title,
              company: job.employer_name,
              location: `${job.job_city || ""}, ${job.job_country || ""}`,
              applyLink: directOpt?.apply_link || job.job_apply_link || `https://www.google.com/search?q=${encodeURIComponent(job.employer_name + " " + job.job_title + " official careers")}`,
              isRemote: job.job_is_remote
            };
          });
          return res.json(liveJobs.slice(0, 5));
        }
      } catch (apiErr) {
        console.warn("Live API query timed out. Serving direct corporate domain matrix.");
      }
    }

    res.json(domainJobs);
  } catch (error) {
    console.error("Error serving domain jobs:", error);
    res.status(500).json({ error: "Failed to fetch domain job listings" });
  }
});

const serverless = require('serverless-http');
module.exports.handler = serverless(app);