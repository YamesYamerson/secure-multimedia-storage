# Tool Call Protocol - Secure File Sharing System

**VERSION: 1.0** - Last Updated: [Current Date]

## 🚨 CRITICAL: Tool Call Order Protocol

**BEFORE** making any tool calls, **ALWAYS** follow this systematic order to ensure proper file referencing and development workflow.

---

## 📋 Pre-Tool Call Checklist

### Step 1: Reference Check (ALWAYS FIRST)
**Tool**: `read_file`  
**Files to check in order**:
1. `project_reference_guide.md` - Check current status and workflow
2. `ai_development_rules.md` - Verify current phase guidelines
3. `secure_file_sharing_plan.txt` - Confirm technical requirements
4. `ui_design_plan.txt` - Check UI specifications (if applicable)
5. `project_changelog.md` - Verify current versions

### Step 2: Status Verification
**Tool**: `list_dir` or `grep_search`  
**Purpose**: Verify current project state and file versions

### Step 3: Development Work
**Tools**: `edit_file`, `search_replace`, `run_terminal_cmd`, etc.  
**Purpose**: Actual development tasks

### Step 4: Documentation Update
**Tool**: `edit_file`  
**File**: `project_changelog.md`  
**Purpose**: Document all changes made

---

## 🔄 Systematic Tool Call Workflow

### **Phase 1: Pre-Development Reference Check**

#### 1.1 Check Project Reference Guide
```markdown
**Tool**: read_file
**Target**: project_reference_guide.md
**Lines**: 1-50 (Current Status section)
**Purpose**: Verify current phase, milestone, and next task
```

#### 1.2 Check AI Development Rules
```markdown
**Tool**: read_file
**Target**: ai_development_rules.md
**Lines**: 1-100 (Core Development Principles)
**Purpose**: Confirm development guidelines for current phase
```

#### 1.3 Check Master Plan
```markdown
**Tool**: read_file
**Target**: secure_file_sharing_plan.txt
**Lines**: [Phase-specific section]
**Purpose**: Verify technical requirements and deliverables
```

#### 1.4 Check UI Design (if applicable)
```markdown
**Tool**: read_file
**Target**: ui_design_plan.txt
**Lines**: [Component-specific section]
**Purpose**: Verify UI/UX requirements
```

#### 1.5 Check Current Versions
```markdown
**Tool**: read_file
**Target**: project_changelog.md
**Lines**: 1-10 (Version numbers)
**Purpose**: Confirm current file versions
```

### **Phase 2: Development Work**

#### 2.1 File Operations
```markdown
**Tool**: edit_file, search_replace, delete_file
**Order**: 
1. Create new files first
2. Modify existing files
3. Delete obsolete files
**Purpose**: Implement development tasks
```

#### 2.2 Terminal Commands
```markdown
**Tool**: run_terminal_cmd
**Order**:
1. Setup commands (npm install, etc.)
2. Build commands
3. Test commands
4. Deployment commands
**Purpose**: Execute development tasks
```

#### 2.3 Search Operations
```markdown
**Tool**: codebase_search, grep_search, file_search
**Order**:
1. Semantic search for concepts
2. Exact text search for specific terms
3. File search for specific files
**Purpose**: Find relevant code and information
```

### **Phase 3: Post-Development Documentation**

#### 3.1 Update Changelog
```markdown
**Tool**: edit_file
**Target**: project_changelog.md
**Purpose**: Document all changes with version bump
```

#### 3.2 Update Reference Guide (if needed)
```markdown
**Tool**: edit_file
**Target**: project_reference_guide.md
**Purpose**: Update current status and progress
```

---

## 🎯 Tool Call Templates

### Template 1: Starting Development Session
```markdown
**Sequence**:
1. read_file(project_reference_guide.md, 1-50) - Check current status
2. read_file(ai_development_rules.md, 1-100) - Verify guidelines
3. read_file(secure_file_sharing_plan.txt, [phase_section]) - Check requirements
4. read_file(project_changelog.md, 1-10) - Verify versions
5. [Development work begins]
```

### Template 2: Creating New Files
```markdown
**Sequence**:
1. [Pre-development reference check]
2. edit_file(new_file.md) - Create new file
3. edit_file(project_changelog.md) - Document creation
4. edit_file(project_reference_guide.md) - Update if needed
```

### Template 3: Modifying Existing Files
```markdown
**Sequence**:
1. [Pre-development reference check]
2. read_file(target_file.md, relevant_section) - Check current content
3. edit_file(target_file.md) - Make modifications
4. edit_file(project_changelog.md) - Document changes
```

### Template 4: Running Commands
```markdown
**Sequence**:
1. [Pre-development reference check]
2. run_terminal_cmd(command) - Execute command
3. edit_file(project_changelog.md) - Document command execution
```

---

## 🚨 Emergency Tool Call Protocol

### If Unsure About Tool Call Order:
1. **STOP** all development work
2. **Check** `project_reference_guide.md` - Emergency Reference section
3. **Verify** current phase and milestone
4. **Follow** the systematic workflow above
5. **Document** any deviations in changelog

### If Tool Call Fails:
1. **Check** file permissions and existence
2. **Verify** file paths are correct
3. **Confirm** current working directory
4. **Retry** with corrected parameters
5. **Document** the issue in changelog

---

## 📊 Tool Call Tracking

### Required Tool Calls for Each Development Session:

#### Before Development:
- [ ] `read_file(project_reference_guide.md)` - Check current status
- [ ] `read_file(ai_development_rules.md)` - Verify guidelines
- [ ] `read_file(secure_file_sharing_plan.txt)` - Check requirements
- [ ] `read_file(project_changelog.md)` - Verify versions

#### During Development:
- [ ] `edit_file()` - Create/modify files
- [ ] `run_terminal_cmd()` - Execute commands
- [ ] `search_replace()` - Make specific changes
- [ ] `codebase_search()` - Find relevant code

#### After Development:
- [ ] `edit_file(project_changelog.md)` - Document changes
- [ ] `edit_file(project_reference_guide.md)` - Update status (if needed)

---

## 🔍 Tool Call Examples

### Example 1: Starting Phase 1 Development
```markdown
**Tool Call Sequence**:
1. read_file(project_reference_guide.md, 1, 50, false) - Check current status
2. read_file(ai_development_rules.md, 1, 100, false) - Verify Phase 1 guidelines
3. read_file(secure_file_sharing_plan.txt, 100, 200, false) - Check Phase 1 requirements
4. read_file(project_changelog.md, 1, 10, false) - Verify current versions
5. edit_file(new_lambda_function.py) - Create Lambda function
6. edit_file(project_changelog.md) - Document Lambda function creation
```

### Example 2: UI Component Development
```markdown
**Tool Call Sequence**:
1. read_file(project_reference_guide.md, 1, 50, false) - Check current status
2. read_file(ui_design_plan.txt, 200, 300, false) - Check component specifications
3. edit_file(components/FileGrid.js) - Create file grid component
4. edit_file(project_changelog.md) - Document component creation
```

### Example 3: Running Setup Commands
```markdown
**Tool Call Sequence**:
1. read_file(project_reference_guide.md, 1, 50, false) - Check current status
2. run_terminal_cmd("npm install") - Install dependencies
3. run_terminal_cmd("npm run dev") - Start development server
4. edit_file(project_changelog.md) - Document setup completion
```

---

## ⚠️ Critical Rules

### ALWAYS Follow This Order:
1. **Reference Check** (read_file calls to planning documents)
2. **Status Verification** (list_dir, grep_search for current state)
3. **Development Work** (edit_file, run_terminal_cmd, etc.)
4. **Documentation Update** (edit_file to changelog)

### NEVER Skip Reference Check:
- Even for "simple" tasks
- Even for "quick" modifications
- Even for "obvious" changes

### ALWAYS Document Changes:
- Every file creation
- Every file modification
- Every command execution
- Every version change

---

## 🎯 Success Criteria

### For Each Development Session:
- [ ] All reference files checked before work
- [ ] Current phase and milestone verified
- [ ] Technical requirements confirmed
- [ ] Development work completed
- [ ] Changelog updated with changes
- [ ] Reference guide updated if needed

### For Tool Call Protocol:
- [ ] Systematic order followed
- [ ] All required tool calls made
- [ ] No skipped reference checks
- [ ] All changes documented
- [ ] Version control maintained

---

**Remember**: This protocol ensures we never lose track of where we are, always use the correct files, and maintain proper development workflow. Follow this systematic approach for every tool call!

**Last Updated**: [Current Date]  
**Current Version**: 1.0  
**Next Review**: Before starting any development work 