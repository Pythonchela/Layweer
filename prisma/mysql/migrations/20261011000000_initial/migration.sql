-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` LONGTEXT NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `password` LONGTEXT NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'CLIENT',
    `avatar` LONGTEXT NULL,
    `phone` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `twoFAEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFASecret` LONGTEXT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ipAddress` LONGTEXT NULL,
    `userAgent` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthThrottle` (
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `AuthThrottle_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` LONGTEXT NOT NULL,
    `entity` LONGTEXT NOT NULL,
    `entityId` LONGTEXT NULL,
    `details` LONGTEXT NULL,
    `ipAddress` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `department` LONGTEXT NULL,
    `designation` LONGTEXT NULL,
    `barCouncilNo` LONGTEXT NULL,
    `joiningDate` DATETIME(3) NULL,
    `salary` DOUBLE NULL,
    `bankAccount` LONGTEXT NULL,
    `ifscCode` LONGTEXT NULL,
    `panNumber` LONGTEXT NULL,
    `aadharNumber` LONGTEXT NULL,
    `address` LONGTEXT NULL,
    `emergencyContact` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_employeeId_key`(`employeeId`),
    UNIQUE INDEX `Employee_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PRESENT',
    `notes` LONGTEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leave` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `leaveType` LONGTEXT NOT NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `reason` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalarySlip` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `basicSalary` DOUBLE NOT NULL,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `incentives` DOUBLE NOT NULL DEFAULT 0,
    `deductions` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` LONGTEXT NOT NULL,
    `type` LONGTEXT NOT NULL,
    `url` LONGTEXT NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` LONGTEXT NOT NULL,
    `fatherName` LONGTEXT NULL,
    `mobile` LONGTEXT NOT NULL,
    `altMobile` LONGTEXT NULL,
    `email` LONGTEXT NULL,
    `address` LONGTEXT NULL,
    `city` LONGTEXT NULL,
    `state` LONGTEXT NULL,
    `pincode` LONGTEXT NULL,
    `clientType` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL',
    `occupation` LONGTEXT NULL,
    `companyName` LONGTEXT NULL,
    `idType` LONGTEXT NULL,
    `idNumber` LONGTEXT NULL,
    `referenceSource` LONGTEXT NULL,
    `referredBy` LONGTEXT NULL,
    `assignedAdvocate` LONGTEXT NULL,
    `assignedClerk` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `whatsappOptIn` BOOLEAN NOT NULL DEFAULT false,
    `smsOptIn` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_clientId_key`(`clientId`),
    UNIQUE INDEX `Client_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Communication` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `type` LONGTEXT NOT NULL,
    `subject` LONGTEXT NULL,
    `message` LONGTEXT NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentBy` LONGTEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `name` LONGTEXT NOT NULL,
    `mobile` LONGTEXT NOT NULL,
    `email` LONGTEXT NULL,
    `source` LONGTEXT NULL,
    `practiceArea` LONGTEXT NULL,
    `description` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `assignedTo` LONGTEXT NULL,
    `consultationDate` DATETIME(3) NULL,
    `estimatedFee` DOUBLE NULL,
    `conversionDate` DATETIME(3) NULL,
    `notes` LONGTEXT NULL,
    `clientId` VARCHAR(191) NULL,
    `followUpDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `caseNumber` LONGTEXT NULL,
    `cnrNumber` VARCHAR(191) NULL,
    `title` LONGTEXT NOT NULL,
    `caseType` LONGTEXT NOT NULL,
    `court` LONGTEXT NOT NULL,
    `bench` LONGTEXT NULL,
    `judge` LONGTEXT NULL,
    `filingDate` DATETIME(3) NULL,
    `registrationDate` DATETIME(3) NULL,
    `stage` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `clientId` VARCHAR(191) NOT NULL,
    `oppositeParty` LONGTEXT NULL,
    `oppositeAdvocate` LONGTEXT NULL,
    `actsAndSections` LONGTEXT NULL,
    `seniorAdvocateId` VARCHAR(191) NULL,
    `juniorAdvocateId` VARCHAR(191) NULL,
    `clerkId` VARCHAR(191) NULL,
    `description` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `limitationDate` DATETIME(3) NULL,
    `nextHearingDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Case_caseId_key`(`caseId`),
    UNIQUE INDEX `Case_cnrNumber_key`(`cnrNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseHistory` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `event` LONGTEXT NOT NULL,
    `description` LONGTEXT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `addedBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CriminalCase` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `firNumber` LONGTEXT NULL,
    `firDate` DATETIME(3) NULL,
    `policeStation` LONGTEXT NULL,
    `sections` LONGTEXT NULL,
    `accusedName` LONGTEXT NULL,
    `accusedDetails` LONGTEXT NULL,
    `complainantName` LONGTEXT NULL,
    `complainantDetails` LONGTEXT NULL,
    `isArrested` BOOLEAN NOT NULL DEFAULT false,
    `arrestDate` DATETIME(3) NULL,
    `custodyType` LONGTEXT NULL,
    `bailStatus` LONGTEXT NULL,
    `bailType` LONGTEXT NULL,
    `bailDate` DATETIME(3) NULL,
    `remandDate` DATETIME(3) NULL,
    `chargeSheetFiled` BOOLEAN NOT NULL DEFAULT false,
    `chargeSheetDate` DATETIME(3) NULL,
    `trialStage` LONGTEXT NULL,
    `witnesses` LONGTEXT NULL,
    `statements` LONGTEXT NULL,
    `bailApplication` LONGTEXT NULL,
    `revisionDetails` LONGTEXT NULL,
    `evidenceDetails` LONGTEXT NULL,
    `verdict` LONGTEXT NULL,
    `verdictDate` DATETIME(3) NULL,
    `sentence` LONGTEXT NULL,
    `appeal` BOOLEAN NOT NULL DEFAULT false,
    `appealCourt` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CriminalCase_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CivilCase` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `suitType` LONGTEXT NULL,
    `plaintiffName` LONGTEXT NULL,
    `plaintiffDetails` LONGTEXT NULL,
    `defendantName` LONGTEXT NULL,
    `defendantDetails` LONGTEXT NULL,
    `plaint` LONGTEXT NULL,
    `writtenStatement` LONGTEXT NULL,
    `replication` LONGTEXT NULL,
    `issues` LONGTEXT NULL,
    `propertyDetails` LONGTEXT NULL,
    `agreementDetails` LONGTEXT NULL,
    `interimApplication` LONGTEXT NULL,
    `injunctionStatus` LONGTEXT NULL,
    `executionStatus` LONGTEXT NULL,
    `decree` LONGTEXT NULL,
    `decreeDate` DATETIME(3) NULL,
    `appeal` BOOLEAN NOT NULL DEFAULT false,
    `appealDetails` LONGTEXT NULL,
    `revisionDetails` LONGTEXT NULL,
    `evidenceDetails` LONGTEXT NULL,
    `notices` LONGTEXT NULL,
    `orders` LONGTEXT NULL,
    `judgment` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CivilCase_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hearing` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `hearingDate` DATETIME(3) NOT NULL,
    `hearingTime` LONGTEXT NULL,
    `court` LONGTEXT NULL,
    `courtroom` LONGTEXT NULL,
    `judge` LONGTEXT NULL,
    `purpose` LONGTEXT NULL,
    `advocateId` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SCHEDULED',
    `outcome` LONGTEXT NULL,
    `nextDate` DATETIME(3) NULL,
    `adjournmentReason` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `remindersSet` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` VARCHAR(191) NOT NULL,
    `hearingId` VARCHAR(191) NULL,
    `caseId` LONGTEXT NULL,
    `type` LONGTEXT NOT NULL,
    `message` LONGTEXT NOT NULL,
    `sendAt` DATETIME(3) NOT NULL,
    `isSent` BOOLEAN NOT NULL DEFAULT false,
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `providerMessageId` LONGTEXT NULL,
    `lastError` LONGTEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `recipientId` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NULL,
    `name` LONGTEXT NOT NULL,
    `fileName` LONGTEXT NOT NULL,
    `fileUrl` LONGTEXT NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` LONGTEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `folder` LONGTEXT NULL,
    `description` LONGTEXT NULL,
    `uploadedBy` LONGTEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `fileUrl` LONGTEXT NOT NULL,
    `uploadedBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `pendingAmount` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `creditAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` LONGTEXT NULL,
    `createdBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentOrder` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'CREATED',
    `paymentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentOrder_paymentId_key`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `feeType` LONGTEXT NOT NULL,
    `description` LONGTEXT NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `rate` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` LONGTEXT NOT NULL,
    `transactionId` LONGTEXT NULL,
    `receiptNumber` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `recordedBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Payment_paymentId_key`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `name` LONGTEXT NOT NULL,
    `mobile` LONGTEXT NOT NULL,
    `email` LONGTEXT NULL,
    `advocateId` LONGTEXT NULL,
    `appointmentDate` DATETIME(3) NOT NULL,
    `slot` LONGTEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'OFFLINE',
    `purpose` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `fee` DOUBLE NULL,
    `paymentStatus` LONGTEXT NULL,
    `notes` LONGTEXT NULL,
    `meetLink` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `title` LONGTEXT NOT NULL,
    `description` LONGTEXT NULL,
    `caseId` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NULL,
    `creatorId` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` LONGTEXT NOT NULL,
    `message` LONGTEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourtHoliday` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `name` LONGTEXT NOT NULL,
    `court` LONGTEXT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'NATIONAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `title` LONGTEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `category` LONGTEXT NULL,
    `imageUrl` LONGTEXT NULL,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `authorId` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `clientName` LONGTEXT NOT NULL,
    `designation` LONGTEXT NULL,
    `content` LONGTEXT NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `imageUrl` LONGTEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FirmSetting` (
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `category` LONGTEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `caseId` LONGTEXT NULL,
    `recordedBy` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalarySlip` ADD CONSTRAINT `SalarySlip_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocument` ADD CONSTRAINT `EmployeeDocument_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_seniorAdvocateId_fkey` FOREIGN KEY (`seniorAdvocateId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_juniorAdvocateId_fkey` FOREIGN KEY (`juniorAdvocateId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_clerkId_fkey` FOREIGN KEY (`clerkId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseHistory` ADD CONSTRAINT `CaseHistory_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CriminalCase` ADD CONSTRAINT `CriminalCase_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CivilCase` ADD CONSTRAINT `CivilCase_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hearing` ADD CONSTRAINT `Hearing_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_hearingId_fkey` FOREIGN KEY (`hearingId`) REFERENCES `Hearing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentVersion` ADD CONSTRAINT `DocumentVersion_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentOrder` ADD CONSTRAINT `PaymentOrder_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
