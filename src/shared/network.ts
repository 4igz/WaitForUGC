import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	selfReport: (flag: string) => void;
	timeOptionResponse: (time: number) => void;
	selectTrolledPlayer: (player: Player) => void;
}

interface ServerToClientEvents {
	displayTimeOption: (time: number) => void;
	unlockObbies: (num: number) => void;
	beginNuke: () => void;
	announcement: (message: string, prefix: string) => void;
	returnPlayerToLobby: () => void;
}

interface ClientToServerFunctions {
	getUnlockedObbies: () => number;
}

interface ServerToClientFunctions {}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();
