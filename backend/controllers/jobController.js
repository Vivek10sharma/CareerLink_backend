const Job = require('../models/Job');
const mongoose = require('mongoose');
const natural = require('natural'); 
const tokenizer = new natural.WordTokenizer();
const JobApplication = require('../models/JobApplication');


const computeBM25Score = (docText, queryTerms, avgDocLength, N, documentFrequency, k1 = 1.5, b = 0.75) => {
  const tokens = tokenizer.tokenize(docText.toLowerCase());
  const termFreq = {};
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });

  const docLength = tokens.length;
  let score = 0;

  queryTerms.forEach(term => {
    const tf = termFreq[term] || 0;
    const df = documentFrequency[term] || 0;
    const idf = Math.log(((N - df + 0.5) / (df + 0.5)) + 1);

    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength))));
  });

  return score;
};

const searchJobs = async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const keywords = query.toLowerCase().split(/\s+/);

  try {
    const jobs = await Job.find();

    if (!jobs.length) {
      return res.json([]);
    }

    // Calculate average document length including description
    const totalDocLength = jobs.reduce((sum, job) => {
      const combinedText = `${job.title || ''} ${job.company || ''} ${job.category || ''} ${job.location || ''} ${job.description || ''}`;
      const tokens = tokenizer.tokenize(combinedText.toLowerCase());
      return sum + tokens.length;
    }, 0);

    const avgDocLength = totalDocLength / jobs.length;
    const N = jobs.length;

    // Calculate document frequency (df) for each query term
    const documentFrequency = {};
    keywords.forEach(term => {
      documentFrequency[term] = jobs.reduce((count, job) => {
        const combinedText = `${job.title || ''} ${job.company || ''} ${job.category || ''} ${job.location || ''} ${job.description || ''}`.toLowerCase();
        return combinedText.includes(term) ? count + 1 : count;
      }, 0);
    });

    const scoredJobs = jobs.map(job => {
      const combinedText = `${job.title || ''} ${job.company || ''} ${job.category || ''} ${job.location || ''} ${job.description || ''}`;
      const relevanceScore = computeBM25Score(combinedText, keywords, avgDocLength, N, documentFrequency);
      return { ...job._doc, relevanceScore };
    });

    const filteredJobs = scoredJobs
      // .filter(job => job.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    res.json(filteredJobs);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Error performing search' });
  }
};




const postJob = async (req, res) => {
  try {
    const recruiterId = req.recruiter._id;

    if (!recruiterId) {
      return res.status(401).json({ error: 'Unauthorized: recruiterId missing' });
    }

    const { title, description, category, company ,location} = req.body;

    const newJob = new Job({
      title,
      description,
      category,
      company,
      location,
      recruiterId,  
 });

    await newJob.save();

    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob,
    });
  } catch (error) {
    console.error('Post Job Error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.recruiter.id });
    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ error: 'No jobs found' });
    }
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Fetch Jobs Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiterId: req.recruiter._id
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }
     await JobApplication.deleteMany({ job: job._id });

    res.status(200).json({ msg: 'Job deleted successfully' });
  } catch (err) {
    console.error('Delete Job Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const UpdateJob=  async (req, res) => {
    try {
    const jobId = req.params.id;
    const recruiterId = req.recruiter._id;

   const existingJob = await Job.findOne({
  _id: new mongoose.Types.ObjectId(jobId),
  recruiterId: recruiterId, 
});

    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    const { title, description, location, category, company } = req.body;

    existingJob.title = title || existingJob.title;
    existingJob.description = description || existingJob.description;
    existingJob.location = location || existingJob.location;
    existingJob.category = category || existingJob.category;
    existingJob.company = company || existingJob.company;

    const updatedJob = await existingJob.save();
    res.json(updatedJob);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ message: 'Server error while updating job' });
  }
};
const getJobById = async (req, res) => {
  const { id } = req.params;
  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    console.error('Error fetching job by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecommendedJobs = async (candidateId) => {
  const applications = await JobApplication.find({ candidate: candidateId }).populate('job');

  if (!applications.length) return null;

  // 1. Collect category counts and applied job IDs
  const categoryCount = {};
  const appliedJobIds = new Set();

  applications.forEach(app => {
    const job = app.job;
    if (job) {
      const category = job.category?.trim().toLowerCase();
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
      appliedJobIds.add(job._id.toString());
    }
  });

  if (Object.keys(categoryCount).length === 0) return null;

  const sortedCategories = Object.keys(categoryCount).sort(
    (a, b) => categoryCount[b] - categoryCount[a]
  );

  const jobs = [];
  const seenJobIds = new Set();

  // 2. Add jobs by applied category frequency, skipping already applied ones
  for (const category of sortedCategories) {
    const jobsInCategory = await Job.find({
      category: { $regex: new RegExp(`^${category}$`, 'i') },
      _id: { $nin: Array.from(appliedJobIds) }
    }).sort({ createdAt: -1 });

    for (const job of jobsInCategory) {
      const jobId = job._id.toString();
      if (!seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        jobs.push(job);
      }
    }
  }

  // 3. Add other jobs (not in applied categories and not applied before)
  const appliedCategories = new Set(sortedCategories);
  const otherJobs = await Job.find({
    category: { $nin: Array.from(appliedCategories) },
    _id: { $nin: Array.from(appliedJobIds) }
  }).sort({ createdAt: -1 });

  for (const job of otherJobs) {
    const jobId = job._id.toString();
    if (!seenJobIds.has(jobId)) {
      seenJobIds.add(jobId);
      jobs.push(job);
    }
  }

  return jobs;
};



const jobs = async (req, res) => {
  try {
    const candidateId = req.user?.userId;

    let jobList = [];

    if (candidateId) {
      jobList = await getRecommendedJobs(candidateId);
    }

    if (!jobList || !jobList.length) {
      jobList = await Job.find().sort({ createdAt: -1 });
    }

    res.json(jobList);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};


const GetApplyApplication = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.recruiter._id });


    const jobIds = jobs.map(job => job._id);

    const applications = await JobApplication.find({ job: { $in: jobIds } })
      .populate('job', 'title company') 
      .populate('candidate', 'name email'); 

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching recruiter applications:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
  
const updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;

    // Only allow 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: `Application ${status}`, application: updatedApplication });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { postJob, searchJobs, getJobs ,deleteJob , UpdateJob, jobs, getJobById , GetApplyApplication ,updateApplicationStatus };
