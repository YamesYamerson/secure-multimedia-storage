# Project Reference Guide - Secure File Sharing System

**VERSION: 1.0** - Last Updated: [Current Date]

## 🚨 CRITICAL: Always Check This First

**BEFORE** starting any work, **ALWAYS** reference this guide to ensure you're following the correct patterns and using the right files.

---

## 📋 File Reference Quick Lookup

### Core Planning Documents
| File | Purpose | When to Use | Version |
|------|---------|-------------|---------|
| `secure_file_sharing_plan.txt` | **MASTER PLAN** - Never modify directly | Reference for all development decisions | 1.0 |
| `ai_development_rules.md` | **AI RULES** - How to follow the plan | Before every development session | 1.0 |
| `ui_design_plan.txt` | **UI/UX SPECIFICATIONS** - Design guidelines | When working on frontend/UI | 1.0 |
| `testing_framework_plan.txt` | **TESTING FRAMEWORK** - Testing strategy and implementation | Before writing any code | 1.0 |
| `project_changelog.md` | **CHANGE TRACKING** - Document all changes | After any modifications | 1.1 |

### Development Workflow
| Step | Check | Action |
|------|-------|--------|
| 1 | `ai_development_rules.md` | Review current phase and milestone |
| 2 | `secure_file_sharing_plan.txt` | Verify technical requirements |
| 3 | `testing_framework_plan.txt` | Review testing requirements |
| 4 | `ui_design_plan.txt` | Check UI/UX specifications |
| 5 | `project_changelog.md` | Document any changes |

---

## 🎯 Current Project Status

### Active Phase: **Phase 1 - Foundation & Authentication**
### Current Milestone: **1.1 - AWS Infrastructure Setup**
### Next Task: **AWS Account & IAM Setup**

### Phase Progress:
- [ ] **Phase 1**: Foundation & Authentication (Weeks 1-2)
  - [ ] Milestone 1.1: AWS Infrastructure Setup (Days 1-3)
  - [ ] Milestone 1.2: Authentication System (Days 4-7)
  - [ ] Milestone 1.3: Basic API Gateway Setup (Days 8-10)
  - [ ] Milestone 1.4: Frontend Authentication (Days 11-14)

---

## 🔍 Quick Reference Tables

### Tech Stack Reference
| Component | Technology | Version/Details |
|-----------|------------|-----------------|
| **Frontend** | Vanilla JS + Tailwind CSS + Vite | No frameworks unless specified |
| **Backend** | AWS Lambda (Python) + API Gateway | Boto3 for AWS services |
| **Authentication** | AWS Cognito | User pools + Identity pools |
| **Storage** | AWS S3 | With encryption and versioning |
| **Database** | DynamoDB | For metadata and user data |
| **Deployment** | Netlify/Amplify (Frontend) + AWS (Backend) | Serverless architecture |

### Security Requirements
| Requirement | Implementation | Status |
|-------------|----------------|--------|
| HTTPS | Enforced on all endpoints | ⏳ Pending |
| IAM Roles | Least-privilege access | ⏳ Pending |
| Signed URLs | For file upload/download | ⏳ Pending |
| Encryption | S3 server-side encryption | ⏳ Pending |
| Input Validation | All user inputs | ⏳ Pending |
| Audit Logging | CloudWatch + S3 access logs | ⏳ Pending |

### UI Design System
| Element | Specification | Source |
|---------|---------------|--------|
| **Framework** | Tailwind CSS | `ui_design_plan.txt` |
| **Color Palette** | Blue primary, neutral grays | `ui_design_plan.txt` |
| **Typography** | Inter font family | `ui_design_plan.txt` |
| **Spacing** | 4px grid system | `ui_design_plan.txt` |
| **Icons** | Heroicons (24px default) | `ui_design_plan.txt` |

---

## 📝 Development Checklist Template

### Before Starting Any Task:
- [ ] Check current version numbers in all files
- [ ] Reference `ai_development_rules.md` for current phase guidelines
- [ ] Verify technical requirements in `secure_file_sharing_plan.txt`
- [ ] Review testing requirements in `testing_framework_plan.txt`
- [ ] Check UI specifications in `ui_design_plan.txt`
- [ ] Ensure you're working on the correct milestone

### During Development:
- [ ] Follow the specified tech stack
- [ ] Implement security requirements
- [ ] Use the defined UI design system
- [ ] Write tests for each component before implementation
- [ ] Test each component before moving forward
- [ ] Document any deviations from the plan

### After Completing Tasks:
- [ ] Update `project_changelog.md` with changes
- [ ] Verify all deliverables are complete
- [ ] Run all relevant tests and ensure they pass
- [ ] Verify test coverage meets requirements
- [ ] Test functionality according to plan
- [ ] Update this reference guide if needed

---

## 🚨 Emergency Reference

### If You're Unsure About:
| Question | Check This File | Section |
|----------|-----------------|---------|
| **What phase are we in?** | `secure_file_sharing_plan.txt` | Section 6 - Project Execution Plan |
| **What's the current milestone?** | `secure_file_sharing_plan.txt` | Phase-specific milestones |
| **What tech should I use?** | `secure_file_sharing_plan.txt` | Section 2 - Tech Stack |
| **How should I test this?** | `testing_framework_plan.txt` | Testing Integration by Phase |
| **How should the UI look?** | `ui_design_plan.txt` | Component Library |
| **What security is required?** | `secure_file_sharing_plan.txt` | Section 3 - Security Best Practices |
| **How do I follow the plan?** | `ai_development_rules.md` | Core Development Principles |
| **What changes have been made?** | `project_changelog.md` | Version History |

### If You Need to Make Changes:
1. **NEVER** modify `secure_file_sharing_plan.txt` directly
2. **ALWAYS** update `project_changelog.md` with new version
3. **ALWAYS** update this reference guide if needed
4. **ALWAYS** explain the reason for changes

---

## 📊 Progress Tracking

### Phase 1 Checklist (Foundation & Authentication)
- [ ] **Milestone 1.1**: AWS Infrastructure Setup
  - [ ] AWS Account & IAM Setup
  - [ ] S3 Bucket Configuration
  - [ ] DynamoDB Table Design
- [ ] **Milestone 1.2**: Authentication System
  - [ ] AWS Cognito Configuration
  - [ ] Lambda Authentication Functions
- [ ] **Milestone 1.3**: Basic API Gateway Setup
  - [ ] API Gateway Configuration
- [ ] **Milestone 1.4**: Frontend Authentication
  - [ ] Project Setup
  - [ ] Authentication UI

### Deliverables Status:
- [ ] Working authentication system
- [ ] Secure S3 bucket with proper policies
- [ ] Basic API Gateway with auth
- [ ] Login/signup frontend pages

---

## 🔄 Version Control Reminder

### Current Versions:
- `secure_file_sharing_plan.txt`: **1.0** (Never modify)
- `ai_development_rules.md`: **1.0**
- `ui_design_plan.txt`: **1.0**
- `project_changelog.md`: **1.1**
- `project_reference_guide.md`: **1.0**

### Version Update Rules:
- **Major**: Significant plan changes (1.0 → 2.0)
- **Minor**: New features/milestones (1.0 → 1.1)
- **Patch**: Bug fixes/clarifications (1.0 → 1.0.1)

---

## 📞 Quick Commands Reference

### File Search Commands:
```bash
# Find specific content in plan files
grep -r "milestone" secure_file_sharing_plan.txt
grep -r "Phase 1" secure_file_sharing_plan.txt

# Check current versions
head -5 secure_file_sharing_plan.txt
head -5 project_changelog.md
```

### Development Commands:
```bash
# Check current directory structure
ls -la *.txt *.md

# Verify file integrity
wc -l *.txt *.md
```

---

## 🎯 Success Criteria

### For Each Milestone:
- [ ] All specified deliverables complete
- [ ] Security requirements met
- [ ] Code follows specified tech stack
- [ ] UI follows design system
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Changelog reflects changes

### For Phase Completion:
- [ ] All milestones in phase complete
- [ ] Testing completed
- [ ] Security audit passed
- [ ] User approval received
- [ ] Ready for next phase

---

**Remember**: This reference guide is your first stop before any development work. Always check here first to ensure you're following the correct patterns and using the right files!

**Last Updated**: [Current Date]  
**Current Version**: 1.0  
**Next Review**: Before starting any development work 