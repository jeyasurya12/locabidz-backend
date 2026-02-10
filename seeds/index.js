const User = require("../model/user");
const Tool = require("../model/tool");
const Skill = require("../model/skill");
const Role = require("../model/role");
const Fee = require("../model/fee");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");
const NotificationTemplate = require("../model/notificationTemplate");
const LogTemplate = require("../model/logTemplate");
const Privilege = require("../model/privilege");
const AdminUser = require("../model/adminUser");
const AdminRole = require("../model/adminRole");
const Category = require("../model/category");

const seeds = [
  {
    model: AdminUser,
    data: [
      {
        _id: new mongoose.Types.ObjectId(),
        email: "Admin@contractor.com",
        password:
          "$2b$10$AzaSQ6Hi7bKkhrXuhpZIcuDr5NexUJ0cJgMh82qwrhrAVUdyM8/pG",
        firstName: "Admin",
        lastName: "User",
        userId: "A10001",
        role: "admin",
      },
    ],
  },
  {
    model: AdminRole,
    data: [
      {
        _id: "admin",
        name: "Admin",
        privilege: "privilege_1",
      },
    ],
  },
  {
    model: Role,
    data: [
      {
        _id: "contractor",
        name: " I am a Contractor",
        description: "Looking to get work done.",
      },
      {
        _id: "worker",
        name: " I am a Worker",
        description: "Looking to do work",
      },
    ],
  },
  {
    model: Fee,
    data: [
      {
        _id: "createMilestoneFee",
        name: "Create Milestone Fee",
        percentage: 5,
      },
      {
        _id: "releaseMilestoneFee",
        name: "Release Milestone Fee",
        percentage: 5,
      },
      { _id: "amountWithdrawFee", name: "Amount Withdraw Fee", percentage: 5 },
    ],
  },
  {
    model: Skill,
    data: [
      {
        _id: "mobileAppDevelopment",
        name: "Mobile App Development",
      },
      {
        _id: "cybersecurity",
        name: "Cybersecurity",
      },
      {
        _id: "graphicDesign",
        name: "Graphic Design",
      },
      {
        _id: "copywriting",
        name: "Copywriting",
      },
      {
        _id: "frontendDevelopment",
        name: "Frontend Development",
      },
      {
        _id: "uxUiDesign",
        name: "UX/UI Design",
      },
      {
        _id: "motionGraphics",
        name: "Motion Graphics",
      },
      {
        _id: "translationServices",
        name: "Translation Services",
      },
      {
        _id: "scriptwriting",
        name: "Scriptwriting",
      },
      {
        _id: "socialMediaContent",
        name: "Social Media Content",
      },
      {
        _id: "cloudComputing",
        name: "Cloud Computing",
      },
      {
        _id: "threeDModelingAnimation",
        name: "3D Modeling and Animation",
      },
      {
        _id: "webDesign",
        name: "Web Design",
      },
      {
        _id: "branding",
        name: "Branding",
      },
      {
        _id: "contentWriting",
        name: "Content Writing",
      },
      {
        _id: "backendDevelopment",
        name: "Backend Development",
      },
      {
        _id: "databaseManagement",
        name: "Database Management",
      },
      {
        _id: "devOps",
        name: "DevOps",
      },
      {
        _id: "aiMachineLearning",
        name: "AI/Machine Learning",
      },
      {
        _id: "editingProofreading",
        name: "Editing and Proofreading",
      },
      {
        _id: "ghostwriting",
        name: "Ghostwriting",
      },
      {
        _id: "digitalMarketing",
        name: "Digital Marketing",
      },
      {
        _id: "emailMarketing",
        name: "Email Marketing",
      },
      {
        _id: "affiliateMarketing",
        name: "Affiliate Marketing",
      },
      {
        _id: "seoSem",
        name: "SEO/SEM",
      },
      {
        _id: "virtualAssistance",
        name: "Virtual Assistance",
      },
      {
        _id: "dataEntry",
        name: "Data Entry",
      },
      {
        _id: "leadGeneration",
        name: "Lead Generation",
      },
      {
        _id: "sales",
        name: "Sales",
      },
      {
        _id: "customerSupport",
        name: "Customer Support",
      },
      {
        _id: "projectManagement",
        name: "Project Management",
      },
      {
        _id: "eventManagement",
        name: "Event Management",
      },
      {
        _id: "taxPreparation",
        name: "Tax Preparation",
      },
      {
        _id: "financialAnalysis",
        name: "Financial Analysis",
      },
      {
        _id: "payrollManagement",
        name: "Payroll Management",
      },
      {
        _id: "bookkeeping",
        name: "Bookkeeping",
      },
      {
        _id: "cadDesign",
        name: "CAD Design",
      },
      {
        _id: "engineering",
        name: "Engineering",
      },
      {
        _id: "architecture",
        name: "Architecture",
      },
      {
        _id: "tutoring",
        name: "Tutoring",
      },
      {
        _id: "languageInstruction",
        name: "Language Instruction",
      },
      {
        _id: "onlineCourseCreation",
        name: "Online Course Creation",
      },
      {
        _id: "eventServices",
        name: "Event Services",
      },
      {
        _id: "legalAssistance",
        name: "Legal Assistance",
      },
      {
        _id: "fitnessWellness",
        name: "Fitness and Wellness",
      },
      {
        _id: "realEstate",
        name: "Real Estate",
      },
      {
        _id: "photography",
        name: "Photography",
      },
      {
        _id: "research",
        name: "Research",
      },
      {
        _id: "dryWellRepairs",
        name: "Dry Wall Repair",
      },
      {
        _id: "painting",
        name: "Painting",
      },
      {
        _id: "plumbing",
        name: "Plumbing",
      },
      {
        _id: "electricalWork",
        name: "Electrical Work",
      },
      {
        _id: "carpentry",
        name: "Carpentry",
      },
      {
        _id: "drywallInstallation",
        name: "Drywall Installation",
      },
      {
        _id: "roofing",
        name: "Roofing",
      },
      {
        _id: "masonry",
        name: "Masonry",
      },
      {
        _id: "flooringInstallation",
        name: "Flooring Installation",
      },
      {
        _id: "landscaping",
        name: "Landscaping",
      },
      {
        _id: "gardening",
        name: "Gardening",
      },
      {
        _id: "windowInstallation",
        name: "Window Installation",
      },
      {
        _id: "pressureWashing",
        name: "Pressure Washing",
      },
      {
        _id: "welding",
        name: "Welding",
      },
      {
        _id: "metalworking",
        name: "Metalworking",
      },
      {
        _id: "tiling",
        name: "Tiling",
      },
      {
        _id: "waterproofing",
        name: "Waterproofing",
      },
      {
        _id: "bricklaying",
        name: "Bricklaying",
      },
      {
        _id: "plastering",
        name: "Plastering",
      },
      {
        _id: "concreteWork",
        name: "Concrete Work",
      },
      {
        _id: "carRepair",
        name: "Car Repair",
      },
      {
        _id: "boatRepair",
        name: "Boat Repair",
      },
      {
        _id: "applianceRepair",
        name: "Appliance Repair",
      },
      {
        _id: "insulation",
        name: "Insulation",
      },
      {
        _id: "interiorDesign",
        name: "Interior Design",
      },
      {
        _id: "poolMaintenance",
        name: "Pool Maintenance",
      },
      {
        _id: "furnitureAssembly",
        name: "Furniture Assembly",
      },
      {
        _id: "houseCleaning",
        name: "House Cleaning",
      },
    ],
  },
  {
    model: Category,
    data: [
      {
        _id: "1",
        name: "Account Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "1.1",
            name: "Login/Verification",
            description: null,
            isActive: true,
          },
          {
            _id: "1.2",
            name: "Suspension/Appeal",
            description: null,
            isActive: true,
          },
          {
            _id: "1.3",
            name: "Profile Update/Verification",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "2",
        name: "Bidding Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "2.1",
            name: "Proposal Submission/Edit",
            description: null,
            isActive: true,
          },
          {
            _id: "2.2",
            name: "Irrelevant or Spam Job Post",
            description: null,
            isActive: true,
          },
          {
            _id: "2.3",
            name: "An issue in Finding Jobs",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "3",
        name: "Project Award Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "3.1",
            name: "Awarded But No Response",
            description: null,
            isActive: true,
          },
          {
            _id: "3.2",
            name: "Customer Canceled After Acceptance",
            description: null,
            isActive: true,
          },
          {
            _id: "3.3",
            name: "Contract Terms Not Followed",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "4",
        name: "Payment Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "4.1",
            name: "Payment Not Released",
            description: null,
            isActive: true,
          },
          {
            _id: "4.2",
            name: "Milestone Disputes",
            description: null,
            isActive: true,
          },
          {
            _id: "4.3",
            name: "Unauthorized Deductions",
            description: null,
            isActive: true,
          },
          {
            _id: "4.4",
            name: "Refund Requests",
            description: null,
            isActive: true,
          },
          {
            _id: "4.5",
            name: "Escrow Disputes",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "5",
        name: "Work Delivery Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "5.1",
            name: "Quality Disputes",
            description: null,
            isActive: true,
          },
          {
            _id: "5.2",
            name: "Work Denied by Customer",
            description: null,
            isActive: true,
          },
          {
            _id: "5.3",
            name: "Extra Work Demands",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "6",
        name: "Communication Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "6.1",
            name: "Unresponsive Customer",
            description: null,
            isActive: true,
          },
          {
            _id: "6.2",
            name: "Miscommunication on Scope",
            description: null,
            isActive: true,
          },
          {
            _id: "6.3",
            name: "Harassment/Unprofessional Behavior",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "7",
        name: "Cancellation Issues",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "7.1",
            name: "Customer Canceled Mid-Project",
            description: null,
            isActive: true,
          },
          {
            _id: "7.2",
            name: "Customer Changed Requirements Midway",
            description: null,
            isActive: true,
          },
          {
            _id: "7.3",
            name: "Partial Work Refund Disputes",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "8",
        name: "Fraud & Policy Violations",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "8.1",
            name: "Fake Jobs/Scams",
            description: null,
            isActive: true,
          },
          {
            _id: "8.2",
            name: "Non-Payment",
            description: null,
            isActive: true,
          },
          {
            _id: "8.3",
            name: "Rule Violations",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "9",
        name: "General Support",
        description: null,
        role: "worker",
        sub1: [
          {
            _id: "9.1",
            name: "Technical Errors",
            description: null,
            isActive: true,
          },
          {
            _id: "9.2",
            name: "Manual Review Requests",
            description: null,
            isActive: true,
          },
          {
            _id: "9.3",
            name: "Other Disputes",
            description: null,
            isActive: true,
          },
        ],
      },
      {
        _id: "10",
        name: "Account Issues",
        description: null,
        sub1: [
          {
            _id: "10.1",
            name: "Login/Verification",
            description: null,
            isActive: true,
          },
          {
            _id: "10.2",
            name: "Suspension/Appeal",
            description: null,
            isActive: true,
          },
          {
            _id: "10.3",
            name: "Profile Update/Verification",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "11",
        name: "Job post Issues",
        description: null,
        sub1: [
          {
            _id: "11.1",
            name: "Unable to Post Job",
            description: null,
            isActive: true,
          },
          {
            _id: "11.2",
            name: "No Bids Received",
            description: null,
            isActive: true,
          },
          {
            _id: "11.3",
            name: "Irrelevant or Spam Bids",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "12",
        name: "Freelancer Issues",
        description: null,
        sub1: [
          {
            _id: "12.1",
            name: "Unresponsive Freelancer",
            description: null,
            isActive: true,
          },
          {
            _id: "12.2",
            name: "Contractor Missed Deadline",
            description: null,
            isActive: true,
          },
          {
            _id: "12.3",
            name: "Poor Work Quality",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "13",
        name: "Payment Issues",
        description: null,
        sub1: [
          {
            _id: "13.1",
            name: "Payment Not Processed",
            description: null,
            isActive: true,
          },
          {
            _id: "13.2",
            name: "Overcharged/Duplicate Payment",
            description: null,
            isActive: true,
          },
          {
            _id: "13.3",
            name: "Refund Requests",
            description: null,
            isActive: true,
          },
          {
            _id: "13.4",
            name: "Escrow disputes",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "14",
        name: "Contract & Milestone Issues",
        description: null,
        sub1: [
          {
            _id: "14.1",
            name: "Milestone Not Completed",
            description: null,
            isActive: true,
          },
          {
            _id: "14.2",
            name: "Contractor Requesting Extra Payment",
            description: null,
            isActive: true,
          },
          {
            _id: "14.3",
            name: "Scope Disputes",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "15",
        name: "Work Delivery Issues",
        description: null,
        sub1: [
          {
            _id: "15.1",
            name: "Work Not Delivered",
            description: null,
            isActive: true,
          },
          {
            _id: "15.2",
            name: "Incomplete or Low-Quality Work",
            description: null,
            isActive: true,
          },
          {
            _id: "15.3",
            name: "Revision Requests Ignored",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "16",
        name: "Communication Issues",
        description: null,
        sub1: [
          {
            _id: "16.1",
            name: "Contractor Unresponsive",
            description: null,
            isActive: true,
          },
          {
            _id: "16.2",
            name: "Miscommunication on Requirements",
            description: null,
            isActive: true,
          },
          {
            _id: "16.3",
            name: "Harassment/Unprofessional Behavior",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "17",
        name: "Cancellation Issues",
        description: null,
        sub1: [
          {
            _id: "17.1",
            name: "Contractor Canceled After Acceptance",
            description: null,
            isActive: true,
          },
          {
            _id: "17.2",
            name: "Project Canceled Midway",
            description: null,
            isActive: true,
          },
          {
            _id: "17.3",
            name: "Refund & Dispute Process",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "18",
        name: "Fraud & Policy Violations",
        description: null,
        sub1: [
          {
            _id: "18.1",
            name: "Fake Profiles/Contractor",
            description: null,
            isActive: true,
          },
          {
            _id: "18.2",
            name: "Payment Fraud",
            description: null,
            isActive: true,
          },
          {
            _id: "18.3",
            name: "Platform Rule Violations",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
      {
        _id: "19",
        name: "General Support",
        description: null,
        sub1: [
          {
            _id: "19.1",
            name: "Technical Errors",
            description: null,
            isActive: true,
          },
          {
            _id: "19.2",
            name: "Manual Review Requests",
            description: null,
            isActive: true,
          },
          {
            _id: "19.3",
            name: "Other Disputes",
            description: null,
            isActive: true,
          },
        ],
        role: "contractor",
      },
    ],
  },
  {
    model: NotificationTemplate,
    data: [
      {
        _id: "notification_1",
        module: "Post",
        receiverType: "User",
        description: "Create a New Post",
        content: "[name] post created.",
        subject: "[userName] has created a new post",
        action: "Redirect to Post page",
        redirectURL: "proposals",
        notificationType: "in-app",
        subHeader: "Create a New Post",
      },
      {
        _id: "notification_2",
        module: "Proposal",
        receiverType: "User",
        description: "Create a New Proposal",
        content: "New proposal for [name].",
        subject: "[userName] has create a proposal",
        action: "Redirect to Post page",
        redirectURL: "proposals",
        notificationType: "in-app",
        subHeader: "Create a New Proposal",
      },
      {
        _id: "notification_3",
        module: "Chat",
        receiverType: "User",
        description: "Create a New Chat",
        content: "New chat created [name]",
        subject: "[userName] has created a new chat",
        action: "Redirect to chat page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Create a New Chat",
      },
      {
        _id: "notification_4",
        module: "Offer",
        receiverType: "User",
        description: "Create a New Offer",
        content: "New Offer Created [name]",
        subject: "[userName] has created a new offer",
        action: "Redirect to chat page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Create a New Offer",
      },
      {
        _id: "notification_5",
        module: "Offer",
        receiverType: "User",
        description: "Update a Offer",
        content: "Offer Updated [name]",
        subject: "[userName] has update a offer",
        action: "Redirect to chat page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Update a Offer",
      },
      {
        _id: "notification_6",
        module: "Contract",
        receiverType: "User",
        description: "Create a New Contract",
        content: "New Contract created [name]",
        subject: "[userName] has created a new contract",
        action: "Redirect to contract page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Create a New Contract.",
      },
      {
        _id: "notification_7",
        module: "Milestone",
        receiverType: "User",
        description: "Create a New Milestone",
        content: "New Milestone created [name]",
        subject: "[userName] has created a new milestone",
        action: "Redirect to Products page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Create a New Milestone",
      },
      {
        _id: "notification_8",
        module: "Milestone",
        receiverType: "User",
        description: "Update a Milestone",
        content: "[name] Milestone Released.",
        subject: "[userName] has update a milestone",
        action: "Redirect to chat page",
        redirectURL: "chat",
        notificationType: "in-app",
        subHeader: "Update a Milestone",
      },
      {
        _id: "notification_9",
        module: "Review",
        receiverType: "User",
        description: "Create a New Review",
        content: "New Review created [name]",
        subject: "[userName] has created a new review",
        action: "Redirect to Review page",
        redirectURL: "profile",
        notificationType: "in-app",
        subHeader: "Create a New Review",
      },
      {
        _id: "notification_10",
        module: "Auth",
        receiverType: "user",
        description: "User Status Update Confirmation",
        content: `
          <div class="email-container">
            <div class="logo">
              <h1>Locabidz</h1>
            </div>
            <p>Dear [FIRST_NAME],</p><br><br>
            <p>Your account has been successfully updated in our system.</p><br>
            <p>Please use your email & password to login.</p><br>
            <p>Thank you for choosing us as your service provider. We appreciate your cooperation and understanding.</p><br><br><br>
          </div>
        `,
        subject: "User Status Update Confirmation",
        action: "Redirect to profile page",
        redirectURL: "profile",
        notificationType: "email",
      },
      {
        _id: "notification_11",
        module: "Auth",
        receiverType: "user",
        description: "User Status Update Confirmation",
        content: `
          <div class="email-container">
            <p class="fontstyle">Hello [FIRST_NAME],</p>
            <p>Your account has been rejected.</p><br>
            <p>[MESSAGE]</p><br>
            <p class="fontstyle">If you have any questions or need further assistance, feel free to contact our support team.</p>
          </div>
        `,
        subject: "User Status Update Confirmation",
        action: "Redirect to login page",
        redirectURL: "profile",
        notificationType: "email",
      },
      {
        _id: "notification_12",
        module: "Post",
        receiverType: "user",
        description: "Job Status Update",
        content: `
          <div class="email-container">
            <p class="fontstyle">Hello [FIRST_NAME],</p>
            <p>Your posted job [POST_ID] has been removed.</p><br>
            <p>[MESSAGE]</p><br>
            <p class="fontstyle">If you have any questions or need further assistance, feel free to contact our support team.</p>
          </div>
        `,
        subject: "Job Status Update",
        action: "Redirect to post page",
        redirectURL: "post",
        notificationType: "email",
      },
    ],
  },
  {
    model: LogTemplate,
    data: [
      {
        _id: "log_1",
        module: "User",
        content: "User logged in [status].",
      },
      {
        _id: "log_2",
        module: "User",
        content: "New User registered [status].",
      },
      {
        _id: "log_3",
        module: "User",
        content: "Password changed [status].",
      },
      {
        _id: "log_4",
        module: "User",
        content: "User profile updated [status].",
      },
      {
        _id: "log_5",
        module: "User",
        content: "User role updated [status].",
      },
      {
        _id: "log_6",
        module: "Post",
        content: "New job [postId] posted [status].",
      },
      {
        _id: "log_7",
        module: "User",
        content: "Job [postId] updated [status].",
      },
      {
        _id: "log_8",
        module: "User",
        content: "Job [postId] deleted [status].",
      },
      {
        _id: "log_9",
        module: "User",
        content: "Job [postId] completed [status].",
      },
      {
        _id: "log_10",
        module: "User",
        content: "New proposal [proposalId] created for [postId] [status].",
      },
      {
        _id: "log_11",
        module: "User",
        content: "New offer created for [postId] [status].",
      },
      {
        _id: "log_12",
        module: "User",
        content: "New milestone [milestoneId] created for [postId] [status].",
      },
      {
        _id: "log_13",
        module: "User",
        content: "Milestone [milestoneId] released for [postId] [status].",
      },
    ],
  },
  {
    model: Privilege,
    data: [
      {
        _id: "privilege_1",
        create: true,
        share: true,
        delete: true,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_2",
        create: true,
        share: true,
        delete: true,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_3",
        create: true,
        share: true,
        delete: true,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_4",
        create: true,
        share: true,
        delete: true,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_5",
        create: true,
        share: true,
        delete: false,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_6",
        create: true,
        share: true,
        delete: false,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_7",
        create: true,
        share: true,
        delete: false,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_8",
        create: true,
        share: true,
        delete: false,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_9",
        create: true,
        share: false,
        delete: true,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_10",
        create: true,
        share: false,
        delete: true,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_11",
        create: true,
        share: false,
        delete: true,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_12",
        create: true,
        share: false,
        delete: true,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_13",
        create: true,
        share: false,
        delete: false,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_14",
        create: true,
        share: false,
        delete: false,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_15",
        create: true,
        share: false,
        delete: false,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_16",
        create: true,
        share: false,
        delete: false,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_17",
        create: false,
        share: true,
        delete: true,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_18",
        create: false,
        share: true,
        delete: true,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_19",
        create: false,
        share: true,
        delete: true,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_20",
        create: false,
        share: true,
        delete: true,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_21",
        create: false,
        share: true,
        delete: false,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_22",
        create: false,
        share: true,
        delete: false,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_23",
        create: false,
        share: true,
        delete: false,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_24",
        create: false,
        share: true,
        delete: false,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_25",
        create: false,
        share: false,
        delete: true,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_26",
        create: false,
        share: false,
        delete: true,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_27",
        create: false,
        share: false,
        delete: true,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_28",
        create: false,
        share: false,
        delete: true,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_29",
        create: false,
        share: false,
        delete: false,
        edit: true,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_30",
        create: false,
        share: false,
        delete: false,
        edit: true,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_31",
        create: false,
        share: false,
        delete: false,
        edit: false,
        view: true,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
      {
        _id: "privilege_32",
        create: false,
        share: false,
        delete: false,
        edit: false,
        view: false,
        createdAt: "2022-06-23T10:56:20Z",
        updatedAt: "2022-06-23T10:56:20Z",
      },
    ],
  },
];

const insertSeeds = async () => {
  try {
    for (const seed of seeds) {
      for (const data of seed.data) {
        const isAdminUserSeed = seed.model === AdminUser && data.userId;
        const filter = isAdminUserSeed ? { userId: data.userId } : { _id: data._id };

        const update = isAdminUserSeed
          ? {
              $set: (() => {
                const { _id, ...rest } = data;
                return rest;
              })(),
              $setOnInsert: { _id: data._id },
            }
          : data;

        seed.model.updateOne(filter, update, { upsert: true }, (err, doc) => {
          if (err) {
            console.log(err);
          }
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = insertSeeds;
