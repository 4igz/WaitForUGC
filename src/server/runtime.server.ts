import { Flamework } from "@flamework/core";

warn("Adding paths");
Flamework.addPaths("src/server/components");
Flamework.addPaths("src/server/services");
Flamework.addPaths("src/shared/components");

warn("Igniting Flamework");
Flamework.ignite();
