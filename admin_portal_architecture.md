# Admin Portal - AWS Architecture Plan

## 1. Introduction

This document outlines the cloud infrastructure architecture for the admin portal, focusing on security, cost-effectiveness, and scalability. The architecture is designed to meet the following requirements:

*   AWS infrastructure with VPC isolation and security groups
*   WAF rules configuration for OWASP Top 10 protection
*   Intrusion detection system (IDS) placement and configuration
*   Encryption strategy for data at rest (AES-256) and in transit (TLS 1.3+)
*   RBAC implementation strategy for IAM policies
*   Daily encrypted backup system with air-gapped cloud storage
*   Network diagram showing public/private subnets and security layers

## 2. Architecture Design

### 2.1. VPC Isolation and Security Groups

*   **AWS VPC:** A Virtual Private Cloud (VPC) will be created with public and private subnets in a cost-effective region (e.g., `us-east-1` or `us-west-2`).
*   **Public Subnet:** This subnet will host the Application Load Balancer (ALB) and a NAT Gateway. The ALB will be accessible from the internet and will distribute traffic to the EC2 instances in the private subnet. The NAT Gateway will allow the EC2 instances to access the internet for updates and other outbound traffic.
*   **Private Subnet:** This subnet will host the EC2 instances running the admin portal application and the RDS instance running the PostgreSQL database.
*   **Security Groups:** Security groups will be configured to allow only necessary traffic. For example:
    *   The public subnet will allow HTTP/HTTPS traffic from the internet.
    *   The private subnet will only allow traffic from the public subnet and other internal services.

### 2.2. WAF Rules Configuration

*   **AWS WAF:** AWS WAF will be implemented with rules to protect against OWASP Top 10 vulnerabilities. This includes rules for:
    *   SQL injection
    *   Cross-site scripting (XSS)
    *   Other common attacks

### 2.3. Intrusion Detection System (IDS)

*   **AWS GuardDuty:** AWS GuardDuty will be enabled for continuous monitoring of malicious activity and unauthorized behavior.

### 2.4. Encryption Strategy

*   **Data at Rest:**
    *   AES-256 encryption will be used for data at rest with AWS KMS. This includes encrypting:
        *   S3 buckets
        *   EBS volumes
        *   RDS instances
*   **Data in Transit:**
    *   TLS 1.3+ will be enforced for data in transit using AWS Certificate Manager (ACM) and appropriate configurations on load balancers (e.g., Application Load Balancer) and other services.

### 2.5. RBAC Implementation

*   **AWS IAM:** Role-Based Access Control (RBAC) will be implemented using AWS IAM policies to control access to AWS resources. Roles will be defined for different types of users (e.g., administrators, developers, read-only users) and grant them only the necessary permissions.

### 2.6. Backup System

*   **AWS Backup:** A daily encrypted backup system will be implemented using AWS Backup.
*   **S3 Glacier:** Backups will be stored in S3 Glacier for cost-effective, air-gapped cloud storage.

### 2.7. Network Diagram

```plantuml
@startuml
!theme cerulean

title Admin Portal - AWS Architecture

node "Internet" {
  [User]
}

cloud "AWS Cloud (Cost-Effective Region)" {
  frame "VPC" {
    rectangle "Public Subnet" {
      component "Application Load Balancer (ALB)" {
        [HTTPS (443)]
        [HTTP (80)]
      }
      database "NAT Gateway"
    }

    rectangle "Private Subnet" {
      component "EC2 Instance(s)" {
        [Admin Portal Application]
      }
      database "RDS Instance (PostgreSQL)" {
        [Database]
      }
    }

    frame "Security" {
      [AWS WAF] - [ALB] : Protects against OWASP Top 10
      [AWS GuardDuty] - [VPC] : Intrusion Detection
      [AWS IAM] : RBAC
      [AWS KMS] : Encryption Key Management
      [AWS Backup] - [S3 Glacier] : Daily Encrypted Backups
    }
  }
}

User -- ALB : HTTPS/HTTP
ALB -- EC2 Instance(s) : HTTPS
EC2 Instance(s) -- RDS Instance (PostgreSQL) : Database Connections

@enduml
```

## 3. Implementation Plan

1.  **Choose a Cost-Effective Region:** Based on current pricing, select the most cost-effective AWS region (e.g., `us-east-1` or `us-west-2`).
2.  **Create a VPC:** Create a VPC with public and private subnets.
3.  **Configure Security Groups:** Configure security groups to allow only necessary traffic.
4.  **Implement AWS WAF:** Implement AWS WAF with rules to protect against OWASP Top 10 vulnerabilities.
5.  **Enable AWS GuardDuty:** Enable AWS GuardDuty for continuous monitoring of malicious activity and unauthorized behavior.
6.  **Configure Encryption:** Use AES-256 encryption for data at rest with AWS KMS and enforce TLS 1.3+ for data in transit using AWS Certificate Manager (ACM).
7.  **Implement RBAC:** Implement RBAC using AWS IAM policies to control access to AWS resources.
8.  **Implement Backup System:** Implement a daily encrypted backup system using AWS Backup and store backups in S3 Glacier.
9.  **Deploy the Application:** Deploy the admin portal application to EC2 instances in the private subnet.
10. **Configure the Application Load Balancer (ALB):** Configure the ALB to distribute traffic to the EC2 instances.
11. **Configure the RDS Instance:** Configure the RDS instance to store the application data.

## 4. Security Control Justifications

*   **VPC Isolation:** Isolates the admin portal infrastructure from other AWS resources, reducing the attack surface.
*   **Security Groups:** Control network traffic, preventing unauthorized access to the admin portal.
*   **AWS WAF:** Protects against common web application attacks, such as SQL injection and XSS.
*   **AWS GuardDuty:** Detects malicious activity and unauthorized behavior, providing early warning of potential security incidents.
*   **Encryption:** Protects data at rest and in transit, ensuring confidentiality and integrity.
*   **RBAC:** Controls access to AWS resources, preventing unauthorized users from performing sensitive actions.
*   **Backup System:** Provides a mechanism to recover from data loss or corruption, ensuring business continuity.