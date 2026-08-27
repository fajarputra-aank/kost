CREATE TABLE `videoDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyboardId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`status` enum('draft','rendering','ready') NOT NULL DEFAULT 'draft',
	`scenesJson` text NOT NULL,
	`totalDuration` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoDrafts_id` PRIMARY KEY(`id`)
);
