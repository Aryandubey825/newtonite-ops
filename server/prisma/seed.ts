import { PrismaClient, TeamRole, WorkItemPriority, WorkItemStatus, WorkItemType, ActivityEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Newtonite Operations...');

  // Clean existing tables in topological order
  await prisma.outboxJob.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Teams
  console.log('Creating operational teams...');
  const teamsData = [
    { name: 'SecOps & Incident Response', slug: 'secops', description: 'Real-time security escalations, vulnerability patches, and intrusion response' },
    { name: 'Payments & Settlement', slug: 'payments', description: 'Failed settlements, gateway downtimes, chargeback disputes, and ledger mismatches' },
    { name: 'Platform & Infrastructure', slug: 'infra', description: 'Kubernetes clusters, database failovers, cloud capacity, and network routing' },
    { name: 'Trust & Compliance', slug: 'compliance', description: 'Regulatory audits, KYC anomalies, AML alerts, and data retention mandates' },
  ];

  const teams: Record<string, any> = {};
  for (const t of teamsData) {
    teams[t.slug] = await prisma.team.create({ data: t });
  }

  // 2. Create Users
  console.log('Creating demo users across all roles...');
  const usersData = [
    { email: 'admin@newtonite.io', fullName: 'Alex Mercer (Global Admin)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { email: 'lead.secops@newtonite.io', fullName: 'Sarah Connor (SecOps Lead)', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { email: 'member.secops@newtonite.io', fullName: 'John Reese (SecOps Member)', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { email: 'viewer.secops@newtonite.io', fullName: 'Marcus Wright (SecOps Auditor/Viewer)', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { email: 'lead.payments@newtonite.io', fullName: 'Rachel Zane (Payments Lead)', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
    { email: 'member.payments@newtonite.io', fullName: 'Mike Ross (Payments Member)', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100' },
    { email: 'lead.infra@newtonite.io', fullName: 'Gordon Freeman (Infra Lead)', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
    { email: 'member.infra@newtonite.io', fullName: 'Alyx Vance (Infra Member)', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100' },
    { email: 'lead.compliance@newtonite.io', fullName: 'Donna Paulsen (Compliance Lead)', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    { email: 'member.compliance@newtonite.io', fullName: 'Harvey Specter (Compliance Member)', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
    { email: 'aryandubey825@gmail.com', fullName: 'Aryan Duve', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    users[u.email] = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
      },
    });
  }

  // 3. Assign Team Memberships
  console.log('Configuring team role assignments...');
  const memberships = [
    // Global Admin in all teams as ADMIN
    { userId: users['admin@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.ADMIN },
    { userId: users['admin@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.ADMIN },

    // Aryan Duve (Candidate) as ADMIN in all teams
    { userId: users['aryandubey825@gmail.com'].id, teamId: teams['secops'].id, role: TeamRole.ADMIN },
    { userId: users['aryandubey825@gmail.com'].id, teamId: teams['payments'].id, role: TeamRole.ADMIN },
    { userId: users['aryandubey825@gmail.com'].id, teamId: teams['infra'].id, role: TeamRole.ADMIN },
    { userId: users['aryandubey825@gmail.com'].id, teamId: teams['compliance'].id, role: TeamRole.ADMIN },

    // SecOps team
    { userId: users['lead.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.LEAD },
    { userId: users['member.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.MEMBER },
    { userId: users['viewer.secops@newtonite.io'].id, teamId: teams['secops'].id, role: TeamRole.VIEWER },

    // Payments team
    { userId: users['lead.payments@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.LEAD },
    { userId: users['member.payments@newtonite.io'].id, teamId: teams['payments'].id, role: TeamRole.MEMBER },

    // Infra team
    { userId: users['lead.infra@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.LEAD },
    { userId: users['member.infra@newtonite.io'].id, teamId: teams['infra'].id, role: TeamRole.MEMBER },

    // Compliance team
    { userId: users['lead.compliance@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.LEAD },
    { userId: users['member.compliance@newtonite.io'].id, teamId: teams['compliance'].id, role: TeamRole.MEMBER },
  ];

  for (const m of memberships) {
    await prisma.teamMembership.create({ data: m });
  }

  // 4. Create Curated Showcase Items (for live demos)
  console.log('Seeding 45 curated showcase work items across all teams...');
  const showcaseItems = [
    // SecOps
    {
      teamId: teams['secops'].id,
      title: '🚨 P0: Suspected Credential Stuffing on Auth Gateway',
      description: 'Over 14,000 failed login attempts detected in 5 minutes originating from ASN 45102. WAF IP rate limiting required.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'Patch OpenSSL 3.0 Vulnerability on Edge Proxies (CVE-2026-8921)',
      description: 'CVE-2026-8921 memory corruption patch release. Staging verification completed.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Revoke Deprecated API Keys for Former Vendors',
      description: 'Q3 vendor offboarding audit requires immediate revocation of keys: ak_live_9921 and ak_test_4412.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 3,
    },
    {
      teamId: teams['secops'].id,
      title: 'DDoS Mitigation on Cloudflare Anycast Ingress',
      description: 'Spike of 4.2M rps SYN-flood on US-East API endpoints. Custom rate limiting and BGP blackholing active.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['aryandubey825@gmail.com'].id,
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'Phishing Alert: Malicious Domain Mimicking SSO Portal',
      description: 'Employees reported email lures pointing to newtonite-internal.net. Domain registrar abuse report submitted.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'Rotate Root CA Certificates Across Microservices Cluster',
      description: '90-day certificate lifecycle rotation for internal mTLS communication.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'Audit MFA Compliance for Contractor Accounts',
      description: 'All 84 third-party contractor seats verified with FIDO2 hardware keys.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.RESOLVED,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['viewer.secops@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Isolate Compromised Bastion Host in Staging VPC',
      description: 'Anomalous outbound SSH connection to external IP 185.220.101.5. Security group containment applied; awaiting Lead sign-off for teardown.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['aryandubey825@gmail.com'].id,
      assigneeId: users['aryandubey825@gmail.com'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Secrets Leak Verification in Public Sandbox Repository',
      description: 'GitHub secret scanning triggered on dummy AWS credentials. Confirmed scoped to deleted sandbox account.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.RESOLVED,
      createdById: users['member.secops@newtonite.io'].id,
      assigneeId: users['lead.secops@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Quarterly Vulnerability Penetration Test Remediation',
      description: 'Addressed 4 low-severity XSS findings identified in internal pentest report.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['member.secops@newtonite.io'].id,
      version: 3,
    },
    {
      teamId: teams['secops'].id,
      title: 'Update SIEM Retention Rules for GDPR Compliance',
      description: 'Adjust Elasticsearch index lifecycle management (ILM) policies to purge raw IP logs after 90 days.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.OPEN,
      createdById: users['viewer.secops@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['secops'].id,
      title: 'WAF Rule False Positive Blocking European Mobile App Users',
      description: 'Rule #942100 (SQLi heuristic) triggering on valid UTF-8 username registrations in EMEA.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['lead.secops@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Implement YubiKey Mandatory Policy for Production Deployments',
      description: 'Production release pipeline now enforces hardware security key WebAuthn signature.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.RESOLVED,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['admin@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['secops'].id,
      title: 'Security Awareness Training Tracking - Q3 Cycle',
      description: '100% completion achieved across all engineering cohorts.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['lead.secops@newtonite.io'].id,
      assigneeId: users['viewer.secops@newtonite.io'].id,
      version: 2,
    },

    // Payments
    {
      teamId: teams['payments'].id,
      title: '🚨 Stuck ACH Settlement Batch #4092 ($1.2M USD)',
      description: 'Bank partner SFTP transmission timed out at 01:15 UTC. Resubmission requires dual-operator ledger reconciliation.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['payments'].id,
      title: 'Merchant Dispute: Chargeback Surge on Account #8812',
      description: '15 dispute notices received within 2 hours. Suspected fraudulent merchant onboarding; refund freeze requested.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.payments@newtonite.io'].id,
      assigneeId: users['member.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Stripe Webhook Delivery Failures for Eurozone SEPA Debits',
      description: 'Webhook signature verification failing on 4% of SEPA direct debit confirmations. Investigating clock skew.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: users['member.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Payment Gateway Latency Spike During Flash Sale',
      description: 'Payment gateway latency elevated to 4.2s (p99). Transactions timing out on mobile checkout.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['payments'].id,
      title: 'Double Credit Anomaly on Currency FX Conversions',
      description: 'Users converting USD to JPY observed micro-rounding duplicates on rapid re-submission. OCC latch verified.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: users['aryandubey825@gmail.com'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Reconcile Visa Interchange Fee Adjustments for September',
      description: 'Monthly interchange fee reconciliation matching core ledger to Visa raw settlement files.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.RESOLVED,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: users['lead.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Manual Wire Transfer Authorization for Payout ($450,000)',
      description: 'Enterprise vendor settlement wire requires dual signature approval per SOX compliance.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.payments@newtonite.io'].id,
      assigneeId: users['member.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Apple Pay Token Decryption Error on iOS 18 Safari',
      description: 'Customers on iOS 18 report payment failures with error PKPaymentErrorTypeUnknown.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.OPEN,
      createdById: users['member.payments@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['payments'].id,
      title: 'Implement ISO 20022 XML Payment Messaging Standard',
      description: 'Completed transition from legacy MT103 Swift messaging to pacs.008 schema.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['lead.payments@newtonite.io'].id,
      assigneeId: users['member.payments@newtonite.io'].id,
      version: 3,
    },
    {
      teamId: teams['payments'].id,
      title: 'Negative Balance Cascade on Overdrawn Wallet Accounts',
      description: 'Race condition in ledger balance debit check during simultaneous ATM and POS transactions.',
      type: WorkItemType.PAYMENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['lead.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: '3D Secure 2.0 Challenge Failures on UK Cards',
      description: 'Resolved by updating 3DS SDK to version 2.2.0 supporting biometric challenge flows.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.RESOLVED,
      createdById: users['member.payments@newtonite.io'].id,
      assigneeId: users['lead.payments@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['payments'].id,
      title: 'Annual PCI-DSS Level 1 Attestation of Compliance (AoC)',
      description: 'QSA completed on-site assessment. Clean Attestation of Compliance received.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['admin@newtonite.io'].id,
      version: 2,
    },

    // Platform & Infrastructure
    {
      teamId: teams['infra'].id,
      title: 'Database Primary Replica Storage Reaching 88% Threshold',
      description: 'WAL archive disk utilization expanding faster than purge cycle. Auto-expand volume requested.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: users['member.infra@newtonite.io'].id,
      version: 1,
    },
    {
      teamId: teams['infra'].id,
      title: '🚨 Kubernetes Control Plane etcd Latency Degradation in us-central1',
      description: 'etcd leader election flapping due to disk I/O throttles on root persistent disk. Pod schedules delayed.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['infra'].id,
      title: 'Scale Production Kafka Broker Cluster from 6 to 12 Nodes',
      description: 'Traffic projection requires double partition capacity. Partition reassignment plan drafted; awaiting Lead sign-off.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.infra@newtonite.io'].id,
      assigneeId: users['member.infra@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Upgrade Redis Cluster to Version 7.2 with In-Memory TLS',
      description: 'Rolling update of caching layer across 24 shards with zero downtime.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: users['lead.infra@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Deprecate Ubuntu 20.04 Golden AMI Images in Favor of Alpine/Debian 12',
      description: 'All base container images migrated to distroless images, reducing vulnerability footprint by 82%.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.RESOLVED,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: users['member.infra@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Cross-Region VPC Peering Packet Loss (ap-south-1 to us-east-1)',
      description: 'Inter-region transit gateway observing 18% packet drop. Latency spiked to 260ms.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['infra'].id,
      title: 'Prometheus Long-Term Storage Migration to Cortex/Thanos',
      description: 'Historical metrics retention strategy to offload local SSDs to S3 cold storage.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['aryandubey825@gmail.com'].id,
      assigneeId: users['aryandubey825@gmail.com'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Ingress Nginx OOMKilled Under High WebSocket Load',
      description: 'Memory limit bumped from 2Gi to 8Gi and worker connection limits tuned.',
      type: WorkItemType.INCIDENT,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.RESOLVED,
      createdById: users['lead.infra@newtonite.io'].id,
      assigneeId: users['lead.infra@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['infra'].id,
      title: 'Terraform State Backend Lock Resolution on S3 DynamoDB',
      description: 'Cleaned up orphaned lock after failed CI pipeline run.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['member.infra@newtonite.io'].id,
      assigneeId: users['member.infra@newtonite.io'].id,
      version: 3,
    },
    {
      teamId: teams['infra'].id,
      title: 'Implement Distributed Tracing with OpenTelemetry and Jaeger',
      description: 'Trace context propagation configured across all HTTP and gRPC service boundaries.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.CLOSED,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['lead.infra@newtonite.io'].id,
      version: 2,
    },

    // Trust & Compliance
    {
      teamId: teams['compliance'].id,
      title: 'Annual SOC2 Type II Audit Artifact Collection',
      description: 'Collect git access logs, infrastructure change requests, and encryption at rest certifications.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['compliance'].id,
      title: 'GDPR Article 17 "Right to be Forgotten" Data Erasure Pipeline',
      description: 'User deletion request for 42 EU customer accounts. Crypto-shredding keys generated; awaiting legal Lead sign-off.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.compliance@newtonite.io'].id,
      assigneeId: users['member.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: '🚨 FinCEN Suspicious Activity Report (SAR) Filing Deadline',
      description: '30-day statutory clock expires in 48 hours for structuring transaction pattern flagged by AML rules.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.URGENT,
      status: WorkItemStatus.OPEN,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: null,
      version: 1,
    },
    {
      teamId: teams['compliance'].id,
      title: 'Vendor Risk Assessment for Third-Party AI Inference API',
      description: 'Evaluating data sovereignty, model prompt retention, and zero-data retention agreements with vendor.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: users['member.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: 'KYC Verification Anomaly Spike on High-Risk Passports',
      description: 'Biometric face-match threshold failing on new biometric microchip passports.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['lead.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: 'Quarterly Employee Access Rights Certification',
      description: 'Managers verified and re-certified role assignments for all 340 active employees.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.RESOLVED,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: users['lead.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: 'CCPA Consumer Privacy Disclosure Notice Update',
      description: 'Annual California Consumer Privacy Act privacy policy updates ready for publication.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.MEDIUM,
      status: WorkItemStatus.AWAITING_APPROVAL,
      createdById: users['member.compliance@newtonite.io'].id,
      assigneeId: users['member.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: 'Data Protection Officer (DPO) Annual Regulatory Audit',
      description: 'Annual DPO comprehensive report submitted to Data Protection Commission with no critical findings.',
      type: WorkItemType.TASK,
      priority: WorkItemPriority.LOW,
      status: WorkItemStatus.CLOSED,
      createdById: users['lead.compliance@newtonite.io'].id,
      assigneeId: users['lead.compliance@newtonite.io'].id,
      version: 2,
    },
    {
      teamId: teams['compliance'].id,
      title: 'Cardholder Data Environment (CDE) Boundary Network Pentest',
      description: 'External penetration test confirmed zero data leakage across network isolation boundaries.',
      type: WorkItemType.COMPLIANCE,
      priority: WorkItemPriority.HIGH,
      status: WorkItemStatus.CLOSED,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: users['admin@newtonite.io'].id,
      version: 3,
    },
  ];

  const createdShowcaseMap: Record<number, any> = {};
  for (let idx = 0; idx < showcaseItems.length; idx++) {
    const item = showcaseItems[idx];
    const created = await prisma.workItem.create({ data: item });
    createdShowcaseMap[idx] = created;
    await prisma.activityEvent.create({
      data: {
        workItemId: created.id,
        actorId: created.createdById,
        eventType: ActivityEventType.CREATED,
        newState: {
          title: created.title,
          status: created.status,
          priority: created.priority,
          assigneeId: created.assigneeId,
        },
      },
    });
  }

  // Seed Discussion Comments for Showcase Items
  console.log('Seeding operational discussion comments...');
  const commentsToSeed = [
    // Item 0: P0 Credential Stuffing
    {
      workItemId: createdShowcaseMap[0].id,
      authorId: users['lead.secops@newtonite.io'].id,
      content: 'WAF rules deployed to block attacker IP range (ASN 45102). Monitoring packet anomaly counters.',
    },
    {
      workItemId: createdShowcaseMap[0].id,
      authorId: users['member.secops@newtonite.io'].id,
      content: 'Confirming dropped connections: 14,200 packets discarded in last 60 seconds. Ingress load returning to baseline.',
    },
    {
      workItemId: createdShowcaseMap[0].id,
      authorId: users['aryandubey825@gmail.com'].id,
      content: 'Traffic graph stabilized. Rate-limit threshold holding steady. Ready for final incident sign-off.',
    },
    // Item 1: OpenSSL 3.0 Vulnerability
    {
      workItemId: createdShowcaseMap[1].id,
      authorId: users['lead.secops@newtonite.io'].id,
      content: 'Canary cluster updated with 3.0.12 patch. Zero regression detected in test suite.',
    },
    {
      workItemId: createdShowcaseMap[1].id,
      authorId: users['member.secops@newtonite.io'].id,
      content: 'Edge proxies in us-east-1 and eu-central-1 rolling restarts complete. No dropped TLS handshakes.',
    },
    // Item 2: Revoke Deprecated API Keys
    {
      workItemId: createdShowcaseMap[2].id,
      authorId: users['member.secops@newtonite.io'].id,
      content: 'Audit log confirms keys ak_live_9921 and ak_test_4412 have not been accessed in 45 days. Ready for revocation approval.',
    },
    {
      workItemId: createdShowcaseMap[2].id,
      authorId: users['lead.secops@newtonite.io'].id,
      content: 'Reviewed vendor offboarding checklist. Approved for permanent revocation.',
    },
    // Item 14: Stuck ACH Settlement Batch
    {
      workItemId: createdShowcaseMap[14].id,
      authorId: users['lead.payments@newtonite.io'].id,
      content: 'Bank partner SFTP channel restored. Waiting on finance team to reconcile batch #4092 ledger entries.',
    },
    {
      workItemId: createdShowcaseMap[14].id,
      authorId: users['member.payments@newtonite.io'].id,
      content: 'Ledger entries matched against raw MT940 statement. 1,420 transactions accounted for ($1,218,440.00). Ready to release batch.',
    },
    // Item 26: Database Storage Reaching 88%
    {
      workItemId: createdShowcaseMap[26].id,
      authorId: users['lead.infra@newtonite.io'].id,
      content: 'WAL archive storage alert fired at 88%. Triggered automated EBS volume expansion from 500GB to 1TB.',
    },
    {
      workItemId: createdShowcaseMap[26].id,
      authorId: users['member.infra@newtonite.io'].id,
      content: 'Volume resizing completed online. Filesystem resize2fs executed without I/O pause.',
    },
    // Item 36: Annual SOC2 Audit Artifact Collection
    {
      workItemId: createdShowcaseMap[36].id,
      authorId: users['lead.compliance@newtonite.io'].id,
      content: 'Annual SOC2 artifact request submitted to all engineering leads. Please upload evidence by Friday 17:00 UTC.',
    },
    {
      workItemId: createdShowcaseMap[36].id,
      authorId: users['member.compliance@newtonite.io'].id,
      content: 'Compliance binder created. AWS CloudTrail and Okta SAML audit logs indexed.',
    },
  ];

  for (const c of commentsToSeed) {
    await prisma.comment.create({ data: c });
    await prisma.activityEvent.create({
      data: {
        workItemId: c.workItemId,
        actorId: c.authorId,
        eventType: ActivityEventType.COMMENT_ADDED,
        newState: { snippet: c.content.slice(0, 80) },
      },
    });
  }

  // 5. Seed ~1,000 High-Volume Items to Prove Scale & Cursor Pagination
  console.log('Generating 1,000 items to test cursor pagination and index performance...');
  const bulkItems = [];
  const teamList = Object.values(teams);
  const types: WorkItemType[] = [WorkItemType.INCIDENT, WorkItemType.CUSTOMER_ISSUE, WorkItemType.PAYMENT, WorkItemType.COMPLIANCE, WorkItemType.TASK];
  const priorities: WorkItemPriority[] = [WorkItemPriority.LOW, WorkItemPriority.MEDIUM, WorkItemPriority.HIGH, WorkItemPriority.URGENT];
  const statuses: WorkItemStatus[] = [WorkItemStatus.OPEN, WorkItemStatus.IN_PROGRESS, WorkItemStatus.AWAITING_APPROVAL, WorkItemStatus.RESOLVED, WorkItemStatus.CLOSED];

  const now = Date.now();
  for (let i = 1; i <= 1000; i++) {
    const t = teamList[i % teamList.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const type = types[i % types.length];
    const pastTime = new Date(now - (1000 - i) * 60000); // Distributed over past time

    bulkItems.push({
      teamId: t.id,
      title: `[OPS-${1000 + i}] Automated operational task: ${type} - Subsystem verification #${i}`,
      description: `Automated health check telemetry detected an operational event in subsystem unit ${i}. Requires operator verification.`,
      type,
      priority,
      status,
      createdById: users['admin@newtonite.io'].id,
      assigneeId: status === WorkItemStatus.OPEN ? null : users['member.secops@newtonite.io'].id,
      version: 1,
      createdAt: pastTime,
      updatedAt: pastTime,
    });
  }

  await prisma.workItem.createMany({ data: bulkItems });

  console.log('✅ Seed completed successfully:');
  console.log(`- 4 Teams created`);
  console.log(`- 11 Users created with password: 'Password123!' (including Aryan Duve)`);
  console.log(`- 45 Curated showcase items created with activity history & discussion comments`);
  console.log(`- 1,000 Bulk items seeded for cursor pagination`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
