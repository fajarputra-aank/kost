CREATE TABLE `brandKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(20) NOT NULL,
	`secondaryColor` varchar(20) NOT NULL,
	`accentColor` varchar(20) NOT NULL,
	`voiceTone` varchar(240) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandKits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`generationId` int,
	`storyboardId` int,
	`scheduledFor` timestamp NOT NULL,
	`channel` varchar(40) NOT NULL,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`caption` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendarItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storyboards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`title` varchar(160) NOT NULL,
	`brief` text NOT NULL,
	`scenesJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storyboards_id` PRIMARY KEY(`id`)
);
