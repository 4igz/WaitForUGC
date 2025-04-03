import { Controller, OnInit, OnStart } from "@flamework/core";
import React from "@rbxts/react";
import ReactRoblox, { createPortal } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import App from "client/ui/app";

@Controller({})
export class UiController implements OnInit {
	onInit() {
		const root = ReactRoblox.createRoot(new Instance("Folder"));
		root.render(createPortal(<App />, Players.LocalPlayer!.WaitForChild("PlayerGui")));
	}
}
