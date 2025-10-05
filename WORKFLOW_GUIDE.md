# nAnalyzer Development Workflow Guide

## Overview

This project uses a structured development workflow with specific commands for each phase. All commands are defined in `.github/prompts/` and work with the specification/planning system in `.specify/`.

## Available Commands

### 1. `/constitution` - Define Project Principles
**Purpose**: Establish core architectural principles and non-negotiable requirements

**When to use**: At project inception or when major architectural decisions need documentation

**What it does**: Creates or updates `.specify/memory/constitution.md` with project principles

**Status**: ✅ **COMPLETED**
- Constitution already created with 7 core principles
- Privacy-first architecture defined
- Local ML processing mandated
- Modular design principles established

---

### 2. `/specify` - Create Feature Specification
**Purpose**: Document what needs to be built with clear requirements and acceptance criteria

**When to use**: When starting a new feature or refining existing specifications

**What it does**: 
- Creates detailed specification following `.specify/templates/spec-template.md`
- Documents functional & non-functional requirements
- Defines user stories and edge cases
- Sets success criteria

**Status**: ✅ **COMPLETED**
- Detailed technical specification created in `.specify/memory/specification.md`
- Covers GMM speaker identification, RandomForest emotion analysis, Vosk transcription
- Documents complete workflow: registration → training → analysis
- Includes UI specifications with Material-UI components
- API contracts defined

**Current Spec Location**: `.specify/memory/specification.md`

---

### 3. `/clarify` - Resolve Ambiguities
**Purpose**: Ask targeted questions to resolve underspecified areas in the spec

**Workflow**:
1. Scans specification for ambiguities
2. Asks up to 5 targeted questions (one at a time)
3. Integrates answers back into spec
4. Updates affected sections atomically

**Question Categories**:
- Functional scope & behavior
- Domain & data model
- Non-functional quality attributes
- Integration & dependencies
- Edge cases & failure handling

**When to run**: After `/specify` and before `/plan`

**Status**: 🔄 **READY TO RUN**
- Spec is comprehensive but may have areas needing clarification
- Recommended to run before planning phase

**Command**: `/clarify`

---

### 4. `/plan` - Generate Implementation Plan
**Purpose**: Create detailed technical design and architecture plan

**Prerequisites**:
- Feature specification exists (✅ Done)
- Clarifications completed (⚠️ Recommended)

**What it creates**:
- `plan.md` - Technical architecture and file structure
- `data-model.md` - Database schemas and entities
- `contracts/` - API endpoint specifications
- `quickstart.md` - Test scenarios
- `research.md` - Technical decisions

**Workflow**:
1. Reads feature specification
2. Reads constitution for constraints
3. Generates implementation artifacts
4. Documents tech stack choices
5. Creates dependency graph

**Status**: ⏳ **NEXT STEP**
- Ready to generate implementation plan
- Will create detailed technical design

**Command**: `/plan`

---

### 5. `/tasks` - Generate Task Breakdown
**Purpose**: Create actionable, dependency-ordered task list

**Prerequisites**:
- Plan exists (created by `/plan`)

**What it creates**:
- `tasks.md` - Complete task breakdown with IDs
- Ordered by dependencies
- Marks parallel tasks with [P]
- Includes file paths for each task

**Task Organization**:
```
Setup (T001-T005)     - Project initialization
Tests (T006-T020) [P] - Contract & integration tests  
Core (T021-T040)      - Models, services, endpoints
Integration (T041-T050) - DB, middleware, logging
Polish (T051-T060) [P] - Unit tests, docs, optimization
```

**Status**: ⏳ **PENDING** (after `/plan`)

**Command**: `/tasks`

---

### 6. `/analyze` - Cross-Artifact Quality Check
**Purpose**: Validate consistency across spec, plan, and tasks (READ-ONLY)

**Prerequisites**:
- `tasks.md` must exist

**What it checks**:
- Duplication detection
- Ambiguity detection  
- Constitution alignment
- Coverage gaps (requirements without tasks)
- Inconsistencies and conflicts
- Terminology drift

**Severity Levels**:
- **CRITICAL**: Constitution violations, zero coverage on core features
- **HIGH**: Conflicting requirements, ambiguous security/performance
- **MEDIUM**: Terminology drift, missing NFR coverage
- **LOW**: Style improvements, minor redundancy

**Output**: Markdown report with findings table and recommendations

**Status**: ⏳ **PENDING** (after `/tasks`)

**Command**: `/analyze`

---

### 7. `/implement` - Execute Implementation
**Purpose**: Execute all tasks from tasks.md following TDD approach

**Prerequisites**:
- `tasks.md` exists
- Plan and contracts available
- Ideally, `/analyze` shows no critical issues

**Execution Flow**:
1. **Setup Phase**: Initialize project, dependencies, linting
2. **Test Phase**: Write contract tests, integration tests (TDD)
3. **Core Phase**: Implement models, services, endpoints
4. **Integration Phase**: Connect databases, middleware
5. **Polish Phase**: Unit tests, performance, documentation

**Parallel Execution**:
- Tasks marked [P] can run simultaneously
- Tasks affecting same file run sequentially
- Progress tracked per-task

**Status**: ⏳ **PENDING** (after `/tasks` and optionally `/analyze`)

**Command**: `/implement`

---

## Recommended Workflow

### Current Project Status

```
✅ Constitution created (.specify/memory/constitution.md)
✅ Specification created (.specify/memory/specification.md)
🔄 Ready for clarification phase
⏳ Plan generation pending
⏳ Task breakdown pending
⏳ Quality analysis pending
⏳ Implementation pending
```

### Next Steps

#### **Option A: Run Clarification (Recommended)**
```bash
# This will ask up to 5 questions to resolve ambiguities
/clarify
```

**Why**: Reduces rework risk by resolving underspecified areas before planning

**Questions might cover**:
- Data model specifics (user voice sample storage format)
- Performance targets (exact processing time requirements)
- Error handling strategies
- Security requirements for voice data
- Model training data volume

---

#### **Option B: Skip to Planning (Faster, Higher Risk)**
```bash
# Proceed directly to implementation planning
/plan
```

**Why**: Spec is already comprehensive, clarification can be done incrementally

**Risk**: May need to revise plan if ambiguities discovered during implementation

---

### Complete Development Flow

```
1. /constitution    ← ✅ DONE (7 principles defined)
2. /specify         ← ✅ DONE (29K characters, comprehensive spec)
3. /clarify         ← 🔄 CURRENT DECISION POINT
4. /plan           ← Generates technical design
5. /tasks          ← Breaks down into actionable tasks
6. /analyze        ← Quality check (optional but recommended)
7. /implement      ← Execute implementation
```

---

## Project-Specific Details

### What We're Building
**nAnalyzer**: Local, privacy-focused sales call analysis system

**Core Tech Stack** (from specification):
- **Backend**: Python 3.9+, FastAPI, scikit-learn, Vosk
- **Frontend**: React 18+, TypeScript, Material-UI, Chart.js
- **ML Models**: GMM (speaker ID), RandomForest (emotions)
- **Storage**: SQLite + pickle files
- **Constraints**: CPU-only, <50MB models, <1GB memory

### Key Features to Implement
1. **User Registration** - Simple form with user data
2. **Voice Training** - Record 5-10 phrases, train GMM model
3. **Audio Analysis** - Upload audio → segment → identify speakers → analyze emotions
4. **Emotion Tracking** - Enthusiasm, Agreement, Stress (0-10 scale)
5. **Visualization** - Real-time Chart.js graphs synced with audio player
6. **Alert System** - Pop-up recommendations during playback

### Implementation Priorities
1. **Phase 1**: Audio processing pipeline (GMM + RandomForest)
2. **Phase 2**: Frontend with Material-UI components
3. **Phase 3**: Real-time WebSocket analysis (future)

---

## File Organization

```
nAnalyzer/
├── .specify/
│   ├── memory/
│   │   ├── constitution.md          ← ✅ Project principles
│   │   └── specification.md         ← ✅ Feature specification
│   ├── templates/                   ← Templates for plan, tasks
│   └── scripts/                     ← Helper scripts
├── .github/
│   └── prompts/                     ← Command definitions
│       ├── clarify.prompt.md
│       ├── plan.prompt.md
│       ├── tasks.prompt.md
│       ├── analyze.prompt.md
│       └── implement.prompt.md
├── backend/                         ← ⏳ To be implemented
├── frontend/                        ← ⏳ To be implemented
└── [plan artifacts]                 ← ⏳ Generated by /plan
```

---

## Decision Time

### What should we do next?

**Option 1: Run Clarification** (Recommended, ~10 minutes)
```
Pros: Catches ambiguities early, reduces rework
Cons: Adds time to spec phase
Command: /clarify
```

**Option 2: Skip to Planning** (Faster, ~5 minutes)
```
Pros: Faster to start implementation
Cons: May need plan revisions if issues found
Command: /plan
```

**Option 3: Review Specification First**
```
Action: Review .specify/memory/specification.md manually
Then: Decide between Option 1 or 2
```

---

## Tips & Best Practices

### General Guidelines
- Always run commands in sequence (don't skip phases)
- Review output after each command
- Fix critical issues before proceeding
- Use `/analyze` before `/implement` to catch problems early

### Command-Specific Tips

**For /clarify**:
- Answer questions precisely (<=5 words for short answers)
- Choose from options when provided
- Can terminate early if satisfied

**For /plan**:
- Review generated file structure carefully
- Check tech stack matches requirements
- Validate data model against spec

**For /tasks**:
- Verify task order makes sense
- Check parallel markers [P] are correct
- Ensure no critical tasks missing

**For /implement**:
- Follow TDD approach strictly
- Run tests after each phase
- Don't skip setup tasks
- Mark completed tasks as [X]

---

## Scripts Available

Located in `.specify/scripts/bash/`:

1. **check-prerequisites.sh** - Validates environment, returns JSON
2. **setup-plan.sh** - Initializes planning phase
3. **create-new-feature.sh** - Creates new feature branch
4. **update-agent-context.sh** - Updates context files
5. **common.sh** - Shared utilities

---

## Summary

**Current Status**: Ready to proceed from specification to planning phase

**Recommended Next Step**: Run `/clarify` to resolve any ambiguities

**Alternative**: Skip to `/plan` if you're confident in the spec

**After That**: Follow the sequence `/tasks` → `/analyze` → `/implement`

---

**Ready to proceed?** Which option would you like to take?

1. 🔍 `/clarify` - Ask clarification questions (recommended)
2. 📋 `/plan` - Generate implementation plan (faster)
3. 📖 Review specification.md first

Let me know and I'll execute the next command!
