import { Service, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

@Service({})
export class AssignCollisionGroups implements OnStart {
	onStart() {
		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				this.assignPlayerCollision(character);
			});
		});
	}

	assignPlayerCollision(character: Model) {
		for (const part of character.GetDescendants()) {
			if (part.IsA("BasePart")) {
				part.CollisionGroup = "Player";
			}
		}

		character.DescendantAdded.Connect((part) => {
			if (part.IsA("BasePart")) {
				part.CollisionGroup = "Player";
			}
		});
	}
}
