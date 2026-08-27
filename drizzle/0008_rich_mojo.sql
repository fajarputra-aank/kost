CREATE TABLE `videoRenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoDraftId` int,
	`operationName` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`status` enum('queued','rendering','completed','failed') NOT NULL DEFAULT 'queued',
	`videoUrl` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoRenders_id` PRIMARY KEY(`id`)
);
