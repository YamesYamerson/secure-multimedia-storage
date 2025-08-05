# AI Development Rules for Secure File Sharing System

**VERSION: 1.0** - Last Updated: [Current Date]

## IMPORTANT: Version Control Protocol
- **NEVER** modify the original `secure_file_sharing_plan.txt` file
- **ALWAYS** create new versions in `project_changelog.md` when making changes
- **ALWAYS** reference the current version number in both files
- **ALWAYS** check version numbers before making any modifications

---

## Core Development Principles

### 1. Plan Adherence
- **ALWAYS** reference the current phase and milestone from `secure_file_sharing_plan.txt`
- **NEVER** skip ahead to later phases unless explicitly requested
- **ALWAYS** complete all deliverables for a milestone before moving to the next
- **ALWAYS** verify that code changes align with the plan's technical stack and security requirements

### 2. Security-First Approach
- **ALWAYS** implement security best practices listed in the plan
- **NEVER** compromise security for convenience
- **ALWAYS** validate authentication and authorization before file operations
- **ALWAYS** use HTTPS, encryption, and proper IAM policies
- **ALWAYS** implement input validation and sanitization

### 3. Architecture Compliance
- **ALWAYS** follow the specified tech stack:
  - Frontend: Vanilla JS + Tailwind CSS + Vite
  - Backend: AWS Lambda (Python) + API Gateway + S3 + DynamoDB
  - Authentication: AWS Cognito
- **NEVER** introduce new dependencies without justification
- **ALWAYS** maintain the lightweight, serverless architecture

### 4. Development Workflow
- **ALWAYS** start with the current milestone's specific tasks
- **ALWAYS** review testing requirements before implementation
- **ALWAYS** write tests before implementing features (TDD approach)
- **ALWAYS** implement backend (Lambda functions) before frontend integration
- **ALWAYS** test each component before moving to the next
- **ALWAYS** ensure test coverage meets requirements
- **ALWAYS** document any deviations from the plan in the changelog

---

## Phase-Specific Guidelines

### Phase 1: Foundation & Authentication
- **PRIORITY**: Security and infrastructure setup
- **MUST COMPLETE**: AWS setup, Cognito, basic API Gateway, auth UI
- **DO NOT SKIP**: IAM policies, encryption, monitoring setup

### Phase 2: Core File Operations
- **PRIORITY**: Secure file handling with metadata
- **MUST COMPLETE**: Upload/download Lambda functions, metadata management
- **DO NOT SKIP**: File validation, access control, signed URLs

### Phase 3: Search & Organization
- **PRIORITY**: User experience and organization features
- **MUST COMPLETE**: Search engine, filtering, organization UI
- **DO NOT SKIP**: Performance optimization, bulk operations

### Phase 4: Admin & Advanced Features
- **PRIORITY**: Administrative tools and advanced security
- **MUST COMPLETE**: Admin dashboard, enhanced security, backup systems
- **DO NOT SKIP**: Monitoring, audit trails, disaster recovery

### Phase 5: Testing & Deployment
- **PRIORITY**: Quality assurance and production readiness
- **MUST COMPLETE**: Comprehensive testing, security audit, deployment
- **DO NOT SKIP**: Documentation, user training, monitoring setup

---

## Code Quality Standards

### Backend (Python/Lambda)
- **ALWAYS** use proper error handling and logging
- **ALWAYS** implement input validation
- **ALWAYS** use environment variables for configuration
- **ALWAYS** follow AWS best practices for Lambda functions
- **ALWAYS** implement proper IAM roles and permissions

### Frontend (JavaScript/Tailwind)
- **ALWAYS** use vanilla JavaScript (no frameworks unless specified)
- **ALWAYS** implement responsive design with Tailwind CSS
- **ALWAYS** handle errors gracefully
- **ALWAYS** validate user inputs
- **ALWAYS** implement loading states and progress indicators

### Security Implementation
- **ALWAYS** validate JWT tokens
- **ALWAYS** implement proper CORS policies
- **ALWAYS** use signed URLs for file access
- **ALWAYS** encrypt sensitive data
- **ALWAYS** implement rate limiting

---

## Communication Protocol

### When Making Changes
1. **ALWAYS** reference the current version number
2. **ALWAYS** explain which milestone/task you're working on
3. **ALWAYS** justify any deviations from the plan
4. **ALWAYS** update the changelog with changes

### When Providing Code
1. **ALWAYS** include necessary imports and dependencies
2. **ALWAYS** provide complete, runnable code
3. **ALWAYS** include error handling
4. **ALWAYS** add comments for complex logic
5. **ALWAYS** specify environment variables needed

### When Testing
1. **ALWAYS** follow the testing framework plan for each phase
2. **ALWAYS** write unit tests for all functions and components
3. **ALWAYS** test authentication flows
4. **ALWAYS** test file upload/download functionality
5. **ALWAYS** test error scenarios
6. **ALWAYS** verify security measures
7. **ALWAYS** test on multiple browsers/devices
8. **ALWAYS** ensure test coverage meets requirements (90% backend, 85% frontend)
9. **ALWAYS** run security tests for all new features
10. **ALWAYS** validate performance benchmarks

---

## Error Handling Protocol

### If Plan Deviations Are Needed
1. **ALWAYS** document the reason in the changelog
2. **ALWAYS** explain the impact on timeline
3. **ALWAYS** suggest alternative approaches
4. **ALWAYS** get user approval before proceeding

### If Technical Issues Arise
1. **ALWAYS** reference the plan's risk mitigation section
2. **ALWAYS** suggest contingency plans
3. **ALWAYS** maintain security standards
4. **ALWAYS** document solutions for future reference

---

## File Management Rules

### Version Control
- **NEVER** modify `secure_file_sharing_plan.txt` directly
- **ALWAYS** update version numbers in both files
- **ALWAYS** document changes in `project_changelog.md`
- **ALWAYS** reference specific line numbers when discussing changes

### Code Organization
- **ALWAYS** create separate files for different components
- **ALWAYS** use descriptive file names
- **ALWAYS** organize code by functionality
- **ALWAYS** include README files for complex components

---

## Success Criteria Validation

### Before Completing Each Milestone
- [ ] All specified deliverables are complete
- [ ] Security requirements are met
- [ ] Code follows the specified tech stack
- [ ] Error handling is implemented
- [ ] Documentation is updated
- [ ] Changelog reflects all changes

### Before Moving to Next Phase
- [ ] Current phase deliverables are verified
- [ ] Testing is complete
- [ ] Security audit is passed
- [ ] User approval is received
- [ ] Changelog is updated with phase completion

---

## Emergency Procedures

### If Security Issues Are Found
1. **IMMEDIATELY** stop development
2. **ALWAYS** prioritize security fixes
3. **ALWAYS** document the issue and solution
4. **ALWAYS** update the changelog
5. **ALWAYS** get user approval before continuing

### If Timeline Issues Arise
1. **ALWAYS** communicate delays immediately
2. **ALWAYS** suggest timeline adjustments
3. **ALWAYS** prioritize critical features
4. **ALWAYS** document impact on overall project

---

**Remember**: This is a family-focused, security-critical application. Every decision should prioritize security, privacy, and usability for family members. 