import { Controller, OnStart } from "@flamework/core";
import { TextChatService } from "@rbxts/services";
import { Events } from "client/network";

@Controller({})
export class SystemMessages implements OnStart {
	onStart() {
		// Create a TextChannel or use the default one for announcements
		const announcementChannel = TextChatService.WaitForChild("TextChannels").WaitForChild(
			"RBXGeneral",
		) as TextChannel;

		Events.announcement.connect((message: string, prefix: string) => {
			// Create the formatted message with prefix
			const formattedMessage = `[${prefix}] ${message}`;

			announcementChannel.DisplaySystemMessage(formattedMessage);
		});
	}
}
