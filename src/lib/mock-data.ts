export interface Client {
  id: string;
  name: string;
  type: "Sponsor" | "Client";
  industry: string;
  contactName: string;
  contactEmail: string;
  projectCount: number;
  status: "Active" | "Inactive" | "Prospect";
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  stage: "Sourcing" | "Due Diligence" | "Structuring" | "Closing" | "Closed" | "Dead";
  dealSize: string;
  lead: string;
  lastActivity: string;
  taskCount: number;
  docCount: number;
}

export interface Investor {
  id: string;
  name: string;
  firm: string;
  email: string;
  phone: string;
  type: "LP" | "Co-Invest" | "Strategic";
  lastContact: string;
  meetingCount: number;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  dueDate: string;
  status: "To Do" | "In Progress" | "Done" | "Overdue";
  priority: "High" | "Medium" | "Low";
}

export interface Document {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  type: "NDA" | "CIM" | "Financial Model" | "Legal" | "Due Diligence" | "Term Sheet";
  version: string;
  status: "Draft" | "Under Review" | "Final" | "Expired";
  uploadedBy: string;
  uploadedAt: string;
}

export interface TermSheet {
  id: string;
  projectId: string;
  projectName: string;
  investor: string;
  amount: string;
  terms: string;
  status: "Proposed" | "Negotiating" | "Signed" | "Declined";
  date: string;
}

export const clients: Client[] = [
  { id: "c1", name: "Meridian Capital Partners", type: "Sponsor", industry: "Private Equity", contactName: "James Chen", contactEmail: "jchen@meridian.com", projectCount: 3, status: "Active" },
  { id: "c2", name: "Apex Holdings Group", type: "Client", industry: "Real Estate", contactName: "Sarah Williams", contactEmail: "swilliams@apex.com", projectCount: 2, status: "Active" },
  { id: "c3", name: "NorthStar Ventures", type: "Sponsor", industry: "Venture Capital", contactName: "Michael Park", contactEmail: "mpark@northstar.vc", projectCount: 1, status: "Active" },
  { id: "c4", name: "Cascade Infrastructure", type: "Client", industry: "Infrastructure", contactName: "Emily Rodriguez", contactEmail: "erodriguez@cascade.com", projectCount: 1, status: "Prospect" },
  { id: "c5", name: "BluePeak Advisors", type: "Sponsor", industry: "M&A Advisory", contactName: "David Kim", contactEmail: "dkim@bluepeak.com", projectCount: 0, status: "Inactive" },
];

export const projects: Project[] = [
  { id: "p1", name: "Project Atlas", clientId: "c1", clientName: "Meridian Capital Partners", stage: "Due Diligence", dealSize: "$45M", lead: "Alex Torres", lastActivity: "2 hours ago", taskCount: 8, docCount: 14 },
  { id: "p2", name: "Project Beacon", clientId: "c1", clientName: "Meridian Capital Partners", stage: "Structuring", dealSize: "$120M", lead: "Rachel Kim", lastActivity: "1 day ago", taskCount: 5, docCount: 22 },
  { id: "p3", name: "Project Citadel", clientId: "c2", clientName: "Apex Holdings Group", stage: "Sourcing", dealSize: "$30M", lead: "Alex Torres", lastActivity: "3 hours ago", taskCount: 3, docCount: 4 },
  { id: "p4", name: "Project Delta", clientId: "c2", clientName: "Apex Holdings Group", stage: "Closing", dealSize: "$75M", lead: "Marcus Lee", lastActivity: "30 min ago", taskCount: 12, docCount: 31 },
  { id: "p5", name: "Project Echo", clientId: "c3", clientName: "NorthStar Ventures", stage: "Due Diligence", dealSize: "$18M", lead: "Rachel Kim", lastActivity: "5 hours ago", taskCount: 6, docCount: 9 },
  { id: "p6", name: "Project Falcon", clientId: "c1", clientName: "Meridian Capital Partners", stage: "Closed", dealSize: "$200M", lead: "Alex Torres", lastActivity: "2 weeks ago", taskCount: 0, docCount: 45 },
  { id: "p7", name: "Project Granite", clientId: "c4", clientName: "Cascade Infrastructure", stage: "Sourcing", dealSize: "$55M", lead: "Marcus Lee", lastActivity: "1 day ago", taskCount: 2, docCount: 2 },
  { id: "p8", name: "Project Horizon", clientId: "c1", clientName: "Meridian Capital Partners", stage: "Dead", dealSize: "$90M", lead: "Rachel Kim", lastActivity: "1 month ago", taskCount: 0, docCount: 18 },
];

export const investors: Investor[] = [
  { id: "i1", name: "Robert Haines", firm: "Sequoia Partners", email: "rhaines@sequoia.com", phone: "+1 212-555-0101", type: "LP", lastContact: "Jan 15, 2026", meetingCount: 4 },
  { id: "i2", name: "Lisa Chang", firm: "Tiger Global", email: "lchang@tiger.com", phone: "+1 212-555-0102", type: "Co-Invest", lastContact: "Feb 2, 2026", meetingCount: 7 },
  { id: "i3", name: "Ahmed Al-Rashid", firm: "Mubadala Capital", email: "arashid@mubadala.com", phone: "+971 4-555-0103", type: "Strategic", lastContact: "Feb 10, 2026", meetingCount: 2 },
  { id: "i4", name: "Katherine Wells", firm: "Blackstone Group", email: "kwells@blackstone.com", phone: "+1 212-555-0104", type: "LP", lastContact: "Jan 28, 2026", meetingCount: 5 },
  { id: "i5", name: "Thomas Fischer", firm: "KKR Europe", email: "tfischer@kkr.com", phone: "+44 20-555-0105", type: "Co-Invest", lastContact: "Feb 18, 2026", meetingCount: 3 },
];

export const tasks: Task[] = [
  { id: "t1", title: "Review CIM draft v3", projectId: "p1", projectName: "Project Atlas", assignee: "Alex Torres", dueDate: "Feb 22, 2026", status: "In Progress", priority: "High" },
  { id: "t2", title: "Prepare investor deck", projectId: "p2", projectName: "Project Beacon", assignee: "Rachel Kim", dueDate: "Feb 25, 2026", status: "To Do", priority: "High" },
  { id: "t3", title: "Schedule site visit", projectId: "p3", projectName: "Project Citadel", assignee: "Alex Torres", dueDate: "Feb 20, 2026", status: "Overdue", priority: "Medium" },
  { id: "t4", title: "Finalize purchase agreement", projectId: "p4", projectName: "Project Delta", assignee: "Marcus Lee", dueDate: "Feb 21, 2026", status: "In Progress", priority: "High" },
  { id: "t5", title: "Update financial model", projectId: "p1", projectName: "Project Atlas", assignee: "Rachel Kim", dueDate: "Feb 23, 2026", status: "To Do", priority: "Medium" },
  { id: "t6", title: "Send NDA to co-investors", projectId: "p5", projectName: "Project Echo", assignee: "Alex Torres", dueDate: "Feb 19, 2026", status: "Overdue", priority: "High" },
  { id: "t7", title: "Legal review of lease terms", projectId: "p4", projectName: "Project Delta", assignee: "Marcus Lee", dueDate: "Feb 24, 2026", status: "To Do", priority: "Low" },
  { id: "t8", title: "Complete environmental report", projectId: "p5", projectName: "Project Echo", assignee: "Rachel Kim", dueDate: "Feb 26, 2026", status: "To Do", priority: "Medium" },
];

export const documents: Document[] = [
  { id: "d1", name: "Atlas_CIM_v3.pdf", projectId: "p1", projectName: "Project Atlas", type: "CIM", version: "3.0", status: "Under Review", uploadedBy: "Alex Torres", uploadedAt: "Feb 18, 2026" },
  { id: "d2", name: "Atlas_NDA_executed.pdf", projectId: "p1", projectName: "Project Atlas", type: "NDA", version: "1.0", status: "Final", uploadedBy: "Legal", uploadedAt: "Jan 10, 2026" },
  { id: "d3", name: "Beacon_FinModel_v5.xlsx", projectId: "p2", projectName: "Project Beacon", type: "Financial Model", version: "5.0", status: "Draft", uploadedBy: "Rachel Kim", uploadedAt: "Feb 15, 2026" },
  { id: "d4", name: "Delta_PSA_final.pdf", projectId: "p4", projectName: "Project Delta", type: "Legal", version: "2.1", status: "Final", uploadedBy: "Marcus Lee", uploadedAt: "Feb 19, 2026" },
  { id: "d5", name: "Echo_DD_Checklist.xlsx", projectId: "p5", projectName: "Project Echo", type: "Due Diligence", version: "1.0", status: "Under Review", uploadedBy: "Rachel Kim", uploadedAt: "Feb 12, 2026" },
  { id: "d6", name: "Atlas_TermSheet_draft.pdf", projectId: "p1", projectName: "Project Atlas", type: "Term Sheet", version: "1.0", status: "Draft", uploadedBy: "Alex Torres", uploadedAt: "Feb 17, 2026" },
];

export const termSheets: TermSheet[] = [
  { id: "ts1", projectId: "p1", projectName: "Project Atlas", investor: "Sequoia Partners", amount: "$15M", terms: "8% pref, 2x MOIC target", status: "Negotiating", date: "Feb 17, 2026" },
  { id: "ts2", projectId: "p2", projectName: "Project Beacon", investor: "Tiger Global", amount: "$40M", terms: "10% pref, board seat", status: "Proposed", date: "Feb 14, 2026" },
  { id: "ts3", projectId: "p4", projectName: "Project Delta", investor: "Blackstone Group", amount: "$75M", terms: "7% pref, co-invest rights", status: "Signed", date: "Feb 10, 2026" },
  { id: "ts4", projectId: "p5", projectName: "Project Echo", investor: "KKR Europe", amount: "$18M", terms: "9% pref, drag-along", status: "Proposed", date: "Feb 19, 2026" },
];

export const stageOrder = ["Sourcing", "Due Diligence", "Structuring", "Closing", "Closed", "Dead"] as const;

export const stageColors: Record<string, string> = {
  "Sourcing": "bg-muted text-muted-foreground",
  "Due Diligence": "bg-info/10 text-info",
  "Structuring": "bg-warning/10 text-warning",
  "Closing": "bg-primary/10 text-primary",
  "Closed": "bg-success/10 text-success",
  "Dead": "bg-destructive/10 text-destructive",
};
