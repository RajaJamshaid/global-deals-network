GDN Queue, Worker & Background Jobs Architecture

1. Purpose

GDN uses a centralized asynchronous processing architecture for tasks that should not block user-facing requests.

2. Core Principle

Fast API Response → Event/Job Queue → Worker Processing → Database/Service Update → Event/Notification

3. Why Queues

Queues provide:

- asynchronous processing
- retry capability
- workload isolation
- traffic-spike protection
- backpressure
- failure recovery
- horizontal scaling

4. Central Job Architecture

GDN Services
    ↓
Event / Job Producer
    ↓
Queue
    ↓
Worker
    ↓
Business Service
    ↓
Database / Search / Storage
    ↓
Events

5. Job Categories

GDN supports:

- feed synchronization
- ETL processing
- product matching
- deal processing
- price updates
- search indexing
- PSEO generation
- notifications
- campaigns
- analytics processing
- affiliate reconciliation
- conversion processing
- reward validation
- task review
- wallet operations
- payment webhooks
- merchant verification
- image processing
- AI processing
- maintenance jobs

6. Queue Types

Logical queues include:

- "critical"
- "high"
- "normal"
- "low"
- "scheduled"
- "bulk"
- "indexing"
- "notifications"
- "analytics"
- "ai"
- "dead-letter"

7. Priority

Priority determines processing order.

Example:

Critical
High
Normal
Low
Bulk

Financial, security, wallet, payment and critical system jobs receive higher priority.

8. Job Structure

Every job should contain:

- "job_id"
- "job_type"
- "version"
- "priority"
- "source"
- "entity_type"
- "entity_id"
- "payload"
- "attempt"
- "max_attempts"
- "created_at"
- "scheduled_at"
- "expires_at"
- "correlation_id"
- "idempotency_key"

9. Job Payload

Payloads must be:

- small
- validated
- versioned
- serializable
- safe
- deterministic where possible

Large files should use object storage references instead of queue payloads.

10. Producers

Jobs can be produced by:

- API Gateway
- Deal Engine
- Feed Engine
- Merchant Engine
- Affiliate Engine
- Earn Engine
- Wallet Engine
- Commerce Engine
- Payment Engine
- Notification Engine
- Campaign Engine
- Analytics Engine
- AI Engine
- Admin Dashboard
- scheduled jobs

11. Workers

Workers are independent processing units.

Workers should:

- consume jobs
- validate payload
- execute business logic
- commit changes
- emit events
- acknowledge successful jobs
- retry failures
- send permanent failures to DLQ

12. Worker Isolation

Different workloads should use separate worker pools.

Example:

Feed Workers
Search Workers
Notification Workers
Analytics Workers
AI Workers
Payment Workers
Reward Workers
Image Workers

13. Idempotency

Every important job must be idempotent.

Repeated execution must not create:

- duplicate payments
- duplicate rewards
- duplicate wallet transactions
- duplicate affiliate conversions
- duplicate notifications
- duplicate products
- duplicate offers

14. Idempotency Key

Example:

<entity_type>:<entity_id>:<operation>:<version>

15. Retry Strategy

Temporary failures should be retried automatically.

Example:

Attempt 1
↓
30 seconds
↓
Attempt 2
↓
2 minutes
↓
Attempt 3
↓
10 minutes
↓
Attempt 4
↓
DLQ

Exact retry intervals should be configurable.

16. Exponential Backoff

Retries should normally use exponential backoff with jitter.

This prevents large numbers of workers from retrying simultaneously.

17. Retryable Errors

Examples:

- temporary API failure
- timeout
- database connection failure
- rate limit
- temporary storage failure
- provider outage

18. Non-Retryable Errors

Examples:

- invalid schema
- permanently invalid entity
- unauthorized operation
- malformed payload
- deleted required entity

These should move directly to failure handling or DLQ.

19. Dead Letter Queue

Failed jobs are moved to:

DLQ

DLQ records should retain:

- original payload
- error
- stack/reference
- attempts
- timestamps
- worker
- correlation ID

20. DLQ Recovery

Admin can:

- inspect
- retry
- replay
- cancel
- quarantine
- export
- investigate

21. Scheduled Jobs

Scheduled processing supports:

- hourly jobs
- daily jobs
- weekly jobs
- monthly jobs
- custom schedules

22. Feed Sync Jobs

Feed jobs handle:

Source
→ Download
→ Validate
→ Stage
→ Normalize
→ Match
→ Create/Update Offers
→ Index

23. Deal Processing Jobs

Deal jobs handle:

- deal detection
- price changes
- discount validation
- expiry
- deal scoring
- deal indexing
- notifications

24. Price Monitoring Jobs

Price monitoring checks:

- current price
- previous price
- lowest historical price
- discount
- stock
- merchant changes

25. Product Matching Jobs

Workers process:

- SKU
- GTIN
- UPC
- EAN
- MPN
- brand
- model
- title
- attributes
- images

AI-assisted matching must remain subject to confidence thresholds and business rules.

26. Search Index Jobs

Search workers process:

Database Change
→ Index Job
→ Search Document
→ Search Index

27. Bulk Indexing

Large indexing operations should:

- batch records
- checkpoint progress
- limit concurrency
- support pause/resume
- support rollback/rebuild

28. Notification Jobs

Notification workers handle:

- eligibility
- preferences
- consent
- market validation
- deduplication
- scheduling
- delivery
- delivery tracking

29. Campaign Jobs

Campaign workers handle:

- audience generation
- campaign activation
- content preparation
- channel delivery
- attribution
- budget tracking

30. Analytics Jobs

Analytics workers process:

- events
- sessions
- clicks
- conversions
- revenue
- search events
- task events
- reward events

31. Affiliate Jobs

Affiliate workers process:

- link validation
- click events
- conversion imports
- commission updates
- reconciliation
- attribution

32. Earn Engine Jobs

Earn workers handle:

- task eligibility
- task claims
- submissions
- video completion validation
- quality review
- reward calculation
- reward confirmation
- reward reversal

33. Reward Safety

Reward jobs must prevent:

- duplicate rewards
- replay attacks
- fraudulent claims
- unauthorized wallet changes
- negative balance errors

34. Wallet Jobs

Wallet operations must use:

- idempotency
- transaction boundaries
- immutable ledger principles
- audit logging
- concurrency protection

35. Payment Jobs

Payment workers process:

- payment webhooks
- payment status updates
- refunds
- chargebacks
- subscriptions
- reconciliation

36. Financial Jobs

Financial processing must be:

- traceable
- auditable
- idempotent
- reversible through controlled adjustments
- reconciled

37. Merchant Jobs

Merchant workers handle:

- verification
- domain checks
- feed onboarding
- feed synchronization
- product updates
- store status changes

38. Seller Feed Jobs

Seller feeds may originate from:

- API
- Shopify
- CSV
- XML
- JSON
- manual upload

All feeds enter the same central pipeline.

39. Image Jobs

Image workers handle:

- download
- validation
- resizing
- compression
- format conversion
- duplicate detection
- object storage
- CDN preparation

40. PSEO Jobs

PSEO workers handle:

- page eligibility
- content generation
- data insertion
- metadata
- structured data
- sitemap updates
- indexing signals

41. AI Jobs

AI workers process asynchronous operations such as:

- embeddings
- product matching
- content enrichment
- classification
- translation
- recommendation generation
- support analysis

AI output must never bypass core business rules.

42. Support Jobs

Support workers can process:

- ticket routing
- SLA monitoring
- duplicate detection
- automated responses
- escalation
- case creation

43. Trust & Safety Jobs

Trust workers handle:

- fraud signals
- risk scoring
- moderation
- suspicious activity
- merchant risk
- task abuse
- reward abuse

44. Event-Driven Architecture

Important state changes should emit events.

Example:

Offer Updated
↓
Event Bus
├── Search Index
├── Deal Engine
├── Notification Engine
├── Analytics
└── Recommendation Engine

45. Event vs Job

Event: something happened.

Job: something needs to be processed.

Example:

PriceChanged = Event
SendPriceDropNotification = Job

46. Outbox Pattern

Important database changes should use an outbox pattern.

Database Transaction
├── Business Change
└── Outbox Event
        ↓
Event Publisher
        ↓
Queue

This prevents lost events.

47. Queue Delivery

The architecture should support:

- at-least-once delivery
- idempotent consumers
- acknowledgment
- retry
- DLQ
- replay

Exactly-once behavior should be achieved at the business-operation level where required through idempotency and transactional controls.

48. Concurrency

Workers must protect against:

- duplicate processing
- race conditions
- conflicting updates
- double rewards
- double payments
- duplicate inventory updates

49. Distributed Locks

Locks may be used for operations requiring exclusive execution.

Locks must have:

- timeout
- ownership
- safe release
- recovery behavior

50. Job Reservation

Jobs may be temporarily reserved by a worker.

Reservation should expire if the worker fails.

51. Visibility Timeout

Long-running jobs should use a visibility timeout or lease mechanism.

A failed worker should not permanently hide a job.

52. Long-Running Jobs

Long jobs should:

- checkpoint
- report progress
- renew leases
- support cancellation
- support resume

53. Batch Processing

Large datasets should be processed in batches.

Example:

10,000,000 records
↓
10,000-record batches
↓
Workers
↓
Checkpoint

54. Backpressure

When downstream systems are overloaded:

- reduce worker concurrency
- pause low-priority jobs
- preserve critical queues
- delay bulk processing

55. Rate Limits

Workers must respect provider rate limits.

Rate limits should be configurable per:

- provider
- merchant
- API
- queue
- worker pool

56. Circuit Breakers

Repeated provider failures should activate circuit breakers.

Healthy
↓
Failures
↓
Open
↓
Cooldown
↓
Half-Open
↓
Healthy

57. Timeout Policy

External operations require explicit timeouts.

No worker should wait indefinitely.

58. Queue Isolation

Payment and wallet workloads must not be blocked by:

- PSEO
- analytics
- bulk indexing
- AI processing

59. Critical Queue

Critical queue examples:

- payment confirmation
- wallet transaction
- reward reversal
- security action
- critical system recovery

60. Bulk Queue

Bulk queue examples:

- historical indexing
- PSEO generation
- analytics backfill
- image optimization
- large feed imports

61. Queue Scaling

Workers should scale based on:

- queue depth
- processing latency
- CPU
- memory
- error rate
- provider limits

62. Autoscaling

Example:

Low Queue
→ Few Workers

High Queue
→ More Workers

Extreme Queue
→ Controlled Maximum

63. Worker Limits

Each worker pool should have:

- minimum workers
- maximum workers
- concurrency limit
- memory limit
- execution timeout

64. Fairness

High-volume merchants or users must not monopolize shared processing resources.

Per-source and per-tenant quotas may be applied.

65. Priority Aging

Long-waiting normal jobs may gradually receive increased priority to prevent starvation.

66. Queue Deduplication

Duplicate jobs should be suppressed where safe.

Example:

index_product:123
index_product:123
index_product:123

can collapse into one pending job.

67. Job Coalescing

Rapid changes may be combined.

Example:

Price Update 1
Price Update 2
Price Update 3

can become one latest-state indexing job.

68. Latest-State Processing

For derived systems such as search, processing the latest valid state is preferred over replaying every intermediate state when business requirements allow.

69. Event Ordering

Where ordering matters, jobs should include:

- sequence number
- version
- timestamp

Consumers must reject stale updates.

70. Job Expiration

Jobs can have TTL.

Expired jobs should not execute if their result is no longer useful.

71. Cancellation

Jobs should support cancellation where practical.

Example:

- deleted product
- cancelled campaign
- expired deal
- cancelled PSEO batch

72. Manual Jobs

Admin may trigger:

- sync
- reindex
- retry
- replay
- rebuild
- reconciliation
- backfill

All manual actions require authorization and audit logs.

73. Admin Safety

High-risk operations should require:

- RBAC
- confirmation
- reason
- audit event
- optional approval

74. Job Monitoring

Monitor:

- queue depth
- oldest job age
- throughput
- success rate
- retry rate
- failure rate
- DLQ size
- processing duration

75. Worker Monitoring

Monitor:

- CPU
- memory
- concurrency
- execution time
- crashes
- restarts
- provider errors

76. SLOs

Critical queues should have stricter processing objectives than bulk queues.

Example:

Critical: seconds/minutes
Normal: minutes
Bulk: minutes/hours

Exact SLOs should be configured per workload.

77. Alerting

Alerts should trigger on:

- queue backlog
- processing delay
- repeated failures
- DLQ growth
- worker crashes
- payment processing delay
- reward processing delay
- feed freshness failure

78. Queue Dashboard

Admin dashboard should display:

- queue status
- backlog
- active workers
- failed jobs
- retrying jobs
- DLQ
- throughput
- latency

79. Job Dashboard

Each job should expose:

- status
- type
- entity
- attempts
- worker
- timestamps
- error
- correlation ID

80. Job Status

Recommended states:

queued
reserved
processing
completed
retrying
failed
dead_letter
cancelled
expired

81. Job History

Important jobs should retain processing history.

82. Audit

Sensitive job actions require audit logs.

Especially:

- wallet
- payment
- reward
- merchant approval
- trust action
- admin replay

83. Security

Queues must use:

- authentication
- authorization
- encrypted transport
- secure credentials
- payload validation
- secret management
- least privilege

84. Sensitive Payloads

Avoid storing unnecessary:

- passwords
- payment credentials
- authentication secrets
- private personal information

inside queue payloads.

85. Payload Encryption

Sensitive job payloads should be encrypted where required.

86. Tenant Isolation

Seller/merchant-specific jobs must enforce tenant authorization.

87. User Privacy

Analytics and behavioral jobs should follow:

- data minimization
- consent requirements
- retention rules
- anonymization policies

88. Queue Provider Abstraction

GDN should use a queue abstraction layer.

Possible infrastructure implementations may include:

- Cloudflare Queues
- managed message queues
- Redis-based queues
- cloud-native queues

The application should not tightly couple business logic to one provider.

89. Queue Interface

Example:

enqueue()
schedule()
ack()
retry()
deadLetter()
cancel()

90. Worker Interface

Example:

validate()
process()
commit()
emit()
acknowledge()
handleFailure()

91. Queue Configuration

Configuration should include:

- queue name
- priority
- retry policy
- concurrency
- timeout
- retention
- DLQ
- rate limit
- alert threshold

92. Environment Separation

Queues must be separated by environment:

development
staging
production

Production jobs must never execute from development infrastructure.

93. Deployment

Worker code should be deployed independently where practical.

Deployment must support:

- versioning
- rollback
- health checks
- gradual rollout

94. Worker Versioning

Jobs should contain a schema/version identifier.

Older jobs must remain processable during controlled deployments.

95. Schema Compatibility

Queue payload changes must be backward compatible or explicitly migrated.

96. Canary Workers

Critical worker changes may be tested with a small percentage of workload before full rollout.

97. Graceful Shutdown

Workers must:

- stop accepting new jobs
- finish safe jobs
- release leases
- acknowledge completed work
- exit cleanly

98. Crash Recovery

After worker failure:

Lease Expires
↓
Job Returns to Queue
↓
Retry

99. Poison Jobs

Jobs that repeatedly fail due to the same payload should be quarantined instead of consuming unlimited worker capacity.

100. Replay

Events/jobs should be replayable where business requirements permit.

Replay must preserve:

- original event ID
- replay ID
- operator
- reason
- timestamp

101. Backfill

Historical data processing must use separate controlled jobs.

Examples:

- historical search index
- old analytics
- price history
- PSEO pages

102. Data Reconciliation

Scheduled jobs should reconcile:

- database vs search
- affiliate clicks vs conversions
- payments vs ledger
- wallet vs reward ledger
- merchant feed vs offers
- notifications vs delivery records

103. Feed Freshness

Worker system should detect stale feeds.

Example:

Expected Sync: 1 hour
Last Sync: 8 hours
→ Alert

104. Notification Reliability

Notification workers must track:

- queued
- sent
- delivered
- failed
- suppressed

105. Telegram Jobs

Telegram workers handle:

- bot messages
- channel posts
- notifications
- broadcasts
- Mini App-related events

Telegram rate limits must be respected.

106. Affiliate Redirect Boundary

Affiliate redirect requests should remain lightweight.

Heavy processing must happen asynchronously after the redirect event where possible.

107. Commerce Jobs

Commerce workers handle:

- purchase events
- merchant order updates
- coupon processing
- shipping updates
- reconciliation

108. Seller Marketplace Jobs

Seller jobs handle:

Application
→ Payment
→ Verification
→ Review
→ Approval
→ Store Activation

109. Earn Task Jobs

Task jobs handle:

Task Created
→ Review
→ Schedule
→ Activate
→ Claim
→ Submission
→ Validation
→ Reward

110. Video Task Jobs

Video task processing may include:

- video metadata validation
- watch session
- completion validation
- anti-skip signals
- quality checks
- reward eligibility

111. Reward Approval

Reward processing should separate:

Pending
→ Validated
→ Confirmed

Invalid activity:

Pending
→ Rejected

Previously confirmed fraudulent activity:

Confirmed
→ Reversed

112. Financial Safety

No background job may directly mutate financial state without:

- authorization
- validation
- idempotency
- transaction control
- audit trail

113. AI Queue Priority

AI workloads should not consume resources needed by:

- payment
- wallet
- security
- critical notifications

114. AI Cost Controls

AI workers should enforce:

- model limits
- token budgets
- provider quotas
- caching
- batch processing
- fallback models

115. Image Processing Cost Controls

Images should be processed:

- asynchronously
- once
- with deduplication
- with size limits
- using optimized formats

116. Search Reindex Strategy

Search indexing supports:

- incremental indexing
- full rebuild
- partial rebuild
- emergency rebuild

117. Queue Failure Isolation

A failed queue must not bring down unrelated services.

118. Provider Failure

If an external provider fails:

Timeout
→ Retry
→ Circuit Breaker
→ Queue Delay
→ Fallback

119. Graceful Degradation

If non-critical processing is unavailable:

- core browsing remains available
- search may use cached results
- analytics may queue
- AI may be disabled
- bulk processing may pause

120. Capacity Planning

Capacity planning should evaluate:

- jobs/second
- average processing time
- peak queue depth
- worker concurrency
- database throughput
- external API limits

121. Growth Stages

Stage 1

Small worker pools and simple queues.

Stage 2

Separate critical workloads.

Stage 3

Independent worker autoscaling.

Stage 4

Regional/distributed processing.

Stage 5

Global multi-region workload orchestration.

122. Cost Optimization

Use:

- batching
- coalescing
- caching
- autoscaling
- queue prioritization
- scale-to-zero for low-volume workers
- provider-aware scheduling

123. Testing

Test:

- enqueue
- processing
- retries
- idempotency
- concurrency
- DLQ
- replay
- cancellation
- timeout
- provider failure
- worker crash
- recovery

124. Load Testing

Simulate:

- normal traffic
- traffic spikes
- sale events
- viral Telegram campaigns
- large feed imports
- mass notifications
- PSEO batches

125. Chaos Testing

Future testing should simulate:

- queue outage
- worker crash
- database outage
- provider timeout
- network failure
- duplicate events
- delayed events

126. Disaster Recovery

Queue architecture must support:

- recovery
- replay
- checkpointing
- DLQ preservation
- job restoration

127. Backup

Where provider capabilities allow, preserve:

- critical event history
- job metadata
- DLQ records
- processing checkpoints

128. Runbooks

Create runbooks for:

- queue backlog
- worker crash
- DLQ explosion
- payment queue failure
- reward queue failure
- feed failure
- notification failure

129. Operational Ownership

Every critical queue should have:

- owner
- escalation path
- SLO
- runbook
- alert policy

130. Business Continuity

If asynchronous processing temporarily stops:

- user-facing services should continue where possible
- critical financial operations should be protected
- events should remain recoverable
- backlog should be processed after recovery

131. Data Consistency

Workers must respect the central database as the source of truth.

Derived systems must not become authoritative accidentally.

132. Search Consistency

Search index is derived from canonical database state.

133. Analytics Consistency

Analytics events may be eventually consistent and must not overwrite transactional truth.

134. Reward Consistency

Reward ledger and wallet rules remain authoritative.

135. Affiliate Consistency

Affiliate Engine remains authoritative for tracked affiliate links and attribution.

136. Payment Consistency

Payment provider events must be reconciled against the central financial ledger.

137. Event Governance

Every important event should define:

- event name
- version
- producer
- schema
- consumers
- retention
- security classification

138. Recommended Modules

src/jobs/
├── queue/
├── producers/
├── consumers/
├── workers/
├── scheduler/
├── retry/
├── dead-letter/
├── idempotency/
├── locks/
├── events/
├── outbox/
├── monitoring/
└── recovery/

139. Central Job Flow

User / API / Service
        ↓
Business Transaction
        ↓
Outbox / Event
        ↓
Queue
        ↓
Priority + Rate Control
        ↓
Worker
        ↓
Validation
        ↓
Business Logic
        ↓
Database / External Service
        ↓
Event / Notification
        ↓
Analytics

140. Final Architecture Rule

GDN must use:

Synchronous APIs for Fast User Operations → Queues for Asynchronous Work → Specialized Workers for Processing → Idempotency for Safety → Retries for Temporary Failures → DLQ for Permanent Failures → Events for System Integration → Monitoring for Reliability.

The queue/worker layer must remain a shared infrastructure capability used by all GDN engines rather than creating independent background-job systems for individual channels.

141. Final Principle

One Central Queue & Job Architecture → Many Producers → Controlled Priority → Reliable Workers → Safe Retries → Recoverable Failures → Scalable Global Processing → One Integrated GDN Platform
