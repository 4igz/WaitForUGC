//!optimize 2
import Object from "@rbxts/object-utils";
import {
	HttpService,
	Players,
	ReplicatedFirst,
	ReplicatedStorage,
	RunService,
	ScriptContext,
	StarterPlayer,
	Workspace,
} from "@rbxts/services";
import { Events } from "client/network";

import { Controller, OnInit } from "@flamework/core";
import { NoYield } from "@rbxts/thread-utilities";

// Basic fly check
const flyCheck = (character: Model) => {
	character.DescendantAdded.Connect((descendant) => {
		if (descendant.IsA("BodyGyro") || descendant.IsA("BodyVelocity") || descendant.IsA("AngularVelocity")) {
			Events.selfReport("Flying");
		}
		if (descendant.IsA("HopperBin" as "Tool")) {
			Events.selfReport("HopperBin");
		}
	});
};

const humanoidProps = {
	WalkSpeed: 32,
	JumpHeight: 7.2,
	JumpPower: 50,
};

const propertyCheck = (character: Model) => {
	const humanoid = character.WaitForChild("Humanoid") as Humanoid;
	for (const [propName, maxValue] of Object.entries(humanoidProps)) {
		humanoid.GetPropertyChangedSignal(propName as keyof typeof humanoidProps).Connect(() => {
			const newValue = humanoid[propName] as number;
			if (newValue > maxValue) {
				humanoid[propName] = maxValue;
				Events.selfReport("HumanoidEdit");
			}
		});
	}

	humanoid.StateEnabledChanged.Connect((state, isEnabled) => {
		if (state === Enum.HumanoidStateType.Dead && !isEnabled) {
			Events.selfReport("FEGod (StateChange)");
		}
	});
	character.ChildRemoved.Connect((child) => {
		if (child.IsA("Humanoid") && child === humanoid) {
			Events.selfReport("FEGod (NoHumanoid)");
		}
	});
};

const initCharacterDetections = (character: Model) => {
	flyCheck(character);
	propertyCheck(character);
};

const scriptNameCheck = (name: string) => {
	if (name === script.Name) {
		return true;
	}
	const character = Players.LocalPlayer.Character as Model | undefined;
	const containersToCheck = [ReplicatedFirst, ReplicatedStorage, Players.LocalPlayer, character];
	for (const container of containersToCheck) {
		if (!container) continue;
		for (const descendant of container.GetDescendants()) {
			if (descendant.IsA("LocalScript") || descendant.IsA("ModuleScript") || descendant.IsA("Script")) {
				if (descendant.Name === name) {
					return true;
				}
			}
		}
	}
	return false;
};

const physicsFPSCheck = () => {
	const physicsFPS = Workspace.GetRealPhysicsFPS();
	if (physicsFPS > 65) {
		Events.selfReport("Speed Hacking (PhysicsFPS)");
	}
};

// Exploiters Self-Report if they hit any of our detections.
// They are not banned, they are only silently flagged as exploiters.
task.spawn(() => {
	const someCharacter = Players.LocalPlayer.Character;
	if (someCharacter) {
		initCharacterDetections(someCharacter);
	}

	Players.LocalPlayer.CharacterAdded.Connect((character) => {
		initCharacterDetections(character);
	});

	/** RenderStep binding for physics checks */
	RunService.BindToRenderStep("PhysicsFPSCheck", Enum.RenderPriority.First.Value, physicsFPSCheck);

	Workspace.GetPropertyChangedSignal("Gravity").Connect(() => {
		Events.selfReport("GravityMod");
	});

	ScriptContext.Error.Connect((message, stackTrace, source) => {
		// Attempt to parse the script name from stackTrace
		const [i, j] = string.find(stackTrace, ", line");
		if (i !== undefined && j !== undefined) {
			const scriptName = string.sub(stackTrace, 1, i - 1);
			if (!source) {
				// Check if we can find that script name anywhere
				// Otherwise, it's a script that doesn't exist in the game
				// and is likely an erroring exploit script.
				const validScript = scriptNameCheck(scriptName);
				if (!validScript) {
					if (RunService.IsStudio()) {
						warn("Error in Studio triggered a self-report");
						return;
					}
					Events.selfReport(`CustomScriptError: ${message}`);
				}
			}
		}
	});
});
const uiGuid = HttpService.GenerateGUID(false);

@Controller({})
export class SelfReport implements OnInit {
	onInit() {
		// Hide some stuff from the client that we already have cached.
		// By the time we init here, all modules have been loaded already, so we can safely remove them.
		// The goal of destroying all the scripts and renaming them to something ambiguous is to make
		// it harder for exploiters to find modules they're looking for, thus making it harder to exploit the game.
		//
		// No, this isn't 100% foolproof, but it's a good deterrent. It will definitely be a pain for anyone trying
		// to reverse engineer the game to find what they're looking for. Anyone with decent exploiting knowledge will
		// know how to find these nil'd scripts, but it's a good way to ward off inexperienced or ignorant exploit devs.
		//
		// The same guid is used for all destroyed module scripts and UIs to make it harder to distinguish them from each other.
		//
		// To my knowledge, the only way to distinguish them is to get their debug id's somehow, which is different per instance,
		// and then use that to find the instance in nilinstances. But that's a lot of work.
		//
		// What they will more likely do is hook the game metatable and prevent ModuleScripts, folders, etc. from being destroyed and renamed.
		// It does require a decent bit of exploiting knowledge to actually perform this, but it's not impossible, and will be done.
		// They will probably start by preventing ModuleScripts from being destroyed, but the folders containing the ModuleScripts are also destroyed,
		// so they will have to figure that out too. Doing this may break the game for them in unintended ways though due to certain CoreScripts doing the same thing.
		//
		// However, this is only one of the many layers of "security". They have to get past this first though before they can move further.
		task.spawn(() => {
			xpcall(() => {
				// Make it harder to hook the game metatable and prevent scripts from being destroyed.
				// This can be bypassed but it will be more difficult.
				// If they try hooking destroying modules with an infinite wait, we'll know they yielded here.
				// If they hook destroying modules or renaming modules to error then we'll know if something went wrong.
				const safeDispose = (instance: Instance) => {
					if (instance === undefined || typeOf(instance) !== "Instance") return;

					// Any infinite yields (or yields past 1 second) will be caught here.
					// If something errors, we'll know that something went wrong.
					//
					// This will never error under normal circumstances. If this actually happens,
					// there is definitely something fishy going on on the client side.
					NoYield(() => {
						// To disable this in studio, set the DoHide attribute to false.
						// It will still happen in game.
						// It's a good idea to leave it enabled to make sure nothing breaks while still in studio!
						if (RunService.IsStudio() && ReplicatedStorage.GetAttribute("DoHide") === false) {
							return;
						}

						instance.Name = uiGuid;
						instance.Destroy();

						if (!instance.Parent && instance.Name === uiGuid) {
							// Also check for renames, or ancestry changes. We don't do this outside of this normally!
							// Someone might bypass this by doing getconnections on these signals and disconnecting them.
							// This is as far as we'll go to prevent tampering. If they get past this, they're probably going to get past anything else.
							instance.GetPropertyChangedSignal("Name").Connect(errorHandler);
							instance.AncestryChanged.Connect(errorHandler);
						} else {
							error("Instance was not actually disposed!");
						}
					});
				};

				Players.LocalPlayer.WaitForChild("PlayerScripts")
					.WaitForChild("TS")
					.GetDescendants()
					.forEach((child) => {
						// Can't destroy the runtime script or scripts will stop running.
						if (child.IsA("LocalScript")) return;

						safeDispose(child);
					});

				const ts = StarterPlayer.WaitForChild("StarterPlayerScripts").WaitForChild("TS");
				ts.GetDescendants().forEach((child) => {
					if (child.IsA("LocalScript")) return;
					safeDispose(child);
				});

				const tsShared = ReplicatedStorage.WaitForChild("TS");
				tsShared.GetDescendants().forEach((child) => {
					safeDispose(child);
				});
				safeDispose(tsShared);

				function markSubtree(root: Instance, keepSet: Set<Instance>) {
					const stack = [root];
					while (stack.size() > 0) {
						const current = stack.pop()!;
						if (!keepSet.has(current)) {
							keepSet.add(current);
							for (const child of current.GetChildren()) {
								stack.push(child);
							}
						}
					}
				}

				function markAncestors(instance: Instance, keepSet: Set<Instance>, stopAt: Instance) {
					let current: Instance | undefined = instance;
					while (current) {
						keepSet.add(current);
						if (current === stopAt) break;
						current = current.Parent;
					}
				}

				const includeNames = ["@jsdotlua"];
				const rbxtsInclude = ReplicatedStorage.WaitForChild("rbxts_include");
				const keepSet = new Set<Instance>();
				keepSet.add(rbxtsInclude);
				const allDescendants = rbxtsInclude.GetDescendants();

				for (const descendant of allDescendants) {
					if (includeNames.includes(descendant.Name)) {
						markSubtree(descendant, keepSet);

						markAncestors(descendant, keepSet, rbxtsInclude);
					}
				}

				for (const descendant of allDescendants) {
					if (!keepSet.has(descendant)) {
						safeDispose(descendant);
					}
				}

				ReplicatedStorage.SetAttribute("DoHide", undefined);
			}, errorHandler);
		});
	}
}

function errorHandler() {
	// If we got here, it's likely that someone is trying to interfere with the game, by erroring when modules are renamed, or
	// yielding infinitely to prevent the thread from continuing. This should only happen if the user is trying to exploit the game.
	// It's impossible for a normal player to trigger this.
	Events.selfReport("Tampering");
}
