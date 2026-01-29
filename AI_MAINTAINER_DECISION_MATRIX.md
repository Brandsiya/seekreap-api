# SeekReap AI Maintainer – Decision Matrix

**Scope**: Tier-0 Enforcement & Routing  
**Agent**: Tier-0 Sentinel  
**Version**: 1.0.0  
**Effective**: $(date +'%Y-%m-%d')  
**Status**: ACTIVE ENFORCEMENT  

## 1. Purpose
This decision matrix defines exact input classes and the only permitted outcomes the AI Maintainer may produce.

No input outside these classes may be resolved without escalation.

## 2. Outcome Vocabulary (Closed Set)
The AI Maintainer may return only one of the following outcomes:

- **ACCEPTED**
- **REJECTED** 
- **ROUTED TO TIER-1+**
- **ESCALATED**

No other outcomes are permitted.

## 3. Decision Matrix

| Input Type | Description | Allowed Outcome | Required Citation | Notes |
|------------|-------------|-----------------|-------------------|-------|
| **Typo fix** | Spelling, grammar, punctuation | ACCEPTED | TIER0_ISSUE_PROTOCOL.md §Administrative Changes | No semantic change |
| **Formatting change** | Markdown layout, headings, whitespace | ACCEPTED | TIER0_ISSUE_PROTOCOL.md §Administrative Changes | Content unchanged |
| **Broken link fix** | Dead URLs, incorrect references | ACCEPTED | TIER0_ISSUE_PROTOCOL.md §Administrative Changes | Target must be equivalent |
| **File rename (non-semantic)** | Case, naming consistency | ACCEPTED | TIER0_ISSUE_PROTOCOL.md §Administrative Changes | Path only |
| **Documentation clarification** | Rephrasing without meaning change | ACCEPTED | TIER0_ISSUE_PROTOCOL.md §Administrative Changes | Must preserve intent |
| **Terminology alignment** | Aligning defined terms | ACCEPTED | MASTER_INDEX.md | No new terms |
| **New feature request** | Any new capability | ROUTED TO TIER-1+ | TIER_BOUNDARY_CONTRACT.md §Tier Separation | Tier-0 frozen |
| **Behavior change** | Alters spec meaning | REJECTED | TIER_BOUNDARY_CONTRACT.md §Frozen Specification | Not administrative |
| **Implementation code** | Scripts, CLI, services | ROUTED TO TIER-1+ | TIER_BOUNDARY_CONTRACT.md §Tier Separation | Implementation only |
| **Performance discussion** | Optimization proposals | ROUTED TO TIER-1+ | TIER_BOUNDARY_CONTRACT.md §Tier Separation | Non-spec |
| **Economic logic** | Incentives, pricing | ROUTED TO TIER-1+ | TIER_BOUNDARY_CONTRACT.md §Tier Separation | Out of scope |
| **Governance change** | Rule or policy change | ESCALATED | AI_MAINTAINER_AUTHORITY_CHARTER.md §4 | Human only |
| **Tier creation** | Tier-1+, Tier-2 definition | ESCALATED | TIER_BOUNDARY_CONTRACT.md | Human only |
| **Ambiguous wording** | Unclear spec meaning | ESCALATED | AI_MAINTAINER_AUTHORITY_CHARTER.md §3.4 | No interpretation |
| **Conflicting docs** | Two sources disagree | ESCALATED | MASTER_INDEX.md | Resolve canonically |
| **Meta discussion** | "Should we change..." | ESCALATED | AI_MAINTAINER_AUTHORITY_CHARTER.md §4 | Governance |

## 4. Mandatory Response Template
Every AI Maintainer response must conform to this structure:
