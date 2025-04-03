import React from "@rbxts/react";
import { TimeOption } from "./timeOption";
import { TrollMenu } from "./trollMenu";
import { NukeAllButton } from "./nukeAllButton";
import { FlingAllButton } from "./flingAllButton";

export default function App() {
	return (
		<screengui ResetOnSpawn={false}>
			<TimeOption />
			<TrollMenu />
			<NukeAllButton />
			<FlingAllButton />
		</screengui>
	);
}
