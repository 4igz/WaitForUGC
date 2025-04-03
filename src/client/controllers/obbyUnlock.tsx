import { Controller, OnStart } from "@flamework/core";
import { CollectionService } from "@rbxts/services";
import { Events, Functions } from "client/network";

@Controller({})
export class ObbyUnlock implements OnStart {
	currentUnlockedNum: number = 0;

	onStart() {
		Functions.getUnlockedObbies().then((num) => {
			this.unlockObbies(num + 1);
		});

		Events.unlockObbies.connect((num) => {
			this.unlockObbies(num + 1);
		});

		CollectionService.GetInstanceAddedSignal("ObbyLock").Connect((obbyLock) => {
			if ((obbyLock.Parent?.GetAttribute("ObbyNum") as number) <= this.currentUnlockedNum) {
				obbyLock.Destroy();
			}
		});
	}

	unlockObbies(num: number) {
		this.currentUnlockedNum = num;
		for (const obbyLock of CollectionService.GetTagged("ObbyLock")) {
			if ((obbyLock.Parent?.GetAttribute("ObbyNum") as number) <= num) {
				obbyLock.Destroy();
			}
		}
	}
}
