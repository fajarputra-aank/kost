CREATE TABLE `platformPresets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(40) NOT NULL,
	`aspectRatio` varchar(10) NOT NULL,
	`durationSeconds` int NOT NULL,
	`captionTemplate` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platformPresets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studioNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`renderId` int,
	`kind` enum('render_completed','render_failed','system') NOT NULL DEFAULT 'system',
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studioNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `platform` varchar(40) DEFAULT 'Instagram Reels' NOT NULL;--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `aspectRatio` varchar(10) DEFAULT '9:16' NOT NULL;--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `durationSeconds` int DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `queuePosition` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `videoRenders` ADD `notificationSentAt` timestamp;