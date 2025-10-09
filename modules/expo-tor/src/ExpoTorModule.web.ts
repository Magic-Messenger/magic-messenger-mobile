import { NativeModule, registerWebModule } from "expo";

import { ChangeEventPayload } from "./ExpoTor.types";

type ExpoTorModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

class ExpoTorModule extends NativeModule<ExpoTorModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit("onChange", { value });
  }
  hello() {
    return "Hello world! 👋";
  }
}

export default registerWebModule(ExpoTorModule, "ExpoTorModule");
