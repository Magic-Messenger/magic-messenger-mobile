import "react-native-webrtc";

declare module "react-native-webrtc" {
  interface RTCPeerConnection {
    ontrack?: (event: any) => void;
    onicecandidate?: (event: any) => void;
    onconnectionstatechange?: () => void;
    oniceconnectionstatechange?: () => void;
    onicegatheringstatechange?: () => void;
  }
}
