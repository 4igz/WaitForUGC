import { Controller, OnStart } from "@flamework/core";
import CameraShaker from "@rbxts/camera-shaker";
import { ReplicatedStorage, SoundService, Workspace } from "@rbxts/services";

const camera = Workspace.CurrentCamera!;

const shaker = new CameraShaker(Enum.RenderPriority.Camera.Value, (cframe) => {
	camera.CFrame = camera.CFrame.mul(cframe);
});

shaker.Start();

@Controller({})
export class NukeController implements OnStart {
	onStart() {
		if (ReplicatedStorage.GetAttribute("Nuke") === true) {
			this.beginNukeShake();
		}

		ReplicatedStorage.AttributeChanged.Connect((attributeName) => {
			if (attributeName === "Nuke") {
				if (ReplicatedStorage.GetAttribute("Nuke") === true) {
					this.beginNukeShake();
				} else {
					shaker.StopSustained(1);
				}
			}
		});
	}

	beginNukeShake() {
		shaker.ShakeSustain(CameraShaker.Presets.Earthquake);
	}
}
