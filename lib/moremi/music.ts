export type MusicTrack = "sunny-orchard" | "rising-wonder" | "moremi-celebration";
const levels: Record<MusicTrack,number> = {"sunny-orchard":.6,"rising-wonder":.35,"moremi-celebration":.65};
export function musicForView(view:string):MusicTrack|null {
  return view==="mission"?"rising-wonder":view==="reward"?"moremi-celebration":"sunny-orchard";
}

/** Gesture-unlocked music: one active track, quiet transitions and local assets. */
export class MusicDirector {
  private context:AudioContext|null=null;
  private unlocked=false;
  private enabled=true;
  private hidden=false;
  private disposed=false;
  private track:MusicTrack|null=null;
  private replay=0;
  private version=0;
  private buffers=new Map<MusicTrack,Promise<AudioBuffer>>();
  private offsets=new Map<MusicTrack,number>();
  private playing:{track:MusicTrack;source:AudioBufferSourceNode;gain:GainNode;at:number;offset:number;duration:number}|null=null;

  unlock() {
    if(this.disposed)return;
    try {
      this.context??=new AudioContext();
      this.unlocked=true;
      void this.context.resume().then(()=>this.sync()).catch(()=>{});
    } catch { /* Unsupported or blocked audio never blocks the app. */ }
  }
  setScene(view:string,replay=0) {
    const next=musicForView(view);
    if(next===this.track&&(next!=="moremi-celebration"||replay===this.replay)){this.sync();return;}
    this.stop();this.version++;this.track=next;this.replay=replay;
    if(next==="moremi-celebration")this.offsets.set(next,0);
    this.sync();
  }
  setEnabled(enabled:boolean) {
    if(enabled===this.enabled)return;
    this.enabled=enabled;this.version++;
    if(enabled)this.sync();else this.stop(true);
  }
  setHidden(hidden:boolean) {
    if(hidden===this.hidden)return;
    this.hidden=hidden;this.version++;
    if(hidden)this.stop(true);else this.sync();
  }
  private sync() {
    const context=this.context,track=this.track,version=this.version;
    if(!context||!track||!this.unlocked||!this.enabled||this.hidden||this.disposed||this.playing)return;
    let loaded=this.buffers.get(track);
    if(!loaded){
      loaded=fetch(`/audio/${track}.m4a`).then(response=>{if(!response.ok)throw new Error("Music unavailable");return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes));
      this.buffers.set(track,loaded);
      void loaded.catch(()=>this.buffers.delete(track));
    }
    void loaded.then(buffer=>{
      if(this.disposed||!this.enabled||this.hidden||this.track!==track||this.version!==version||this.playing)return;
      const loop=track!=="moremi-celebration";
      const elapsed=this.offsets.get(track)??0;
      if(!loop&&elapsed>=buffer.duration)return;
      const offset=loop?elapsed%buffer.duration:elapsed;
      const source=context.createBufferSource(),gain=context.createGain(),at=context.currentTime;
      source.buffer=buffer;source.loop=loop;source.connect(gain);gain.connect(context.destination);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(levels[track],at+.35);
      this.playing={track,source,gain,at,offset,duration:buffer.duration};
      source.onended=()=>{source.disconnect();gain.disconnect();if(this.playing?.source===source){this.offsets.set(track,buffer.duration);this.playing=null;}};
      source.start(at,offset);
    }).catch(()=>{});
  }
  duck(duration=.4) {
    const playing=this.playing,context=this.context;if(!playing||!context)return;
    const at=context.currentTime,volume=levels[playing.track];
    playing.gain.gain.cancelScheduledValues(at);
    playing.gain.gain.setValueAtTime(Math.min(volume,playing.gain.gain.value),at);
    playing.gain.gain.linearRampToValueAtTime(volume*.3,at+.02);
    playing.gain.gain.linearRampToValueAtTime(volume,at+duration+.25);
  }
  private stop(immediate=false) {
    const playing=this.playing,context=this.context;if(!playing||!context)return;
    const at=context.currentTime;
    this.offsets.set(playing.track,playing.offset+Math.max(0,at-playing.at));
    playing.gain.gain.cancelScheduledValues(at);
    playing.gain.gain.setValueAtTime(playing.gain.gain.value,at);
    playing.gain.gain.linearRampToValueAtTime(0,at+(immediate ? .015 : .2));
    playing.source.onended=()=>{playing.source.disconnect();playing.gain.disconnect();};
    playing.source.stop(at+(immediate ? .02 : .22));this.playing=null;
  }
  dispose() {this.stop(true);this.disposed=true;this.version++;this.buffers.clear();void this.context?.close().catch(()=>{});this.context=null;}
}
