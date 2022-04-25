import { Camera, Mesh, Raycaster, Scene, WebGLRenderer } from 'three';
import { MapNode } from './nodes/MapNode';
import { MapProvider } from './providers/MapProvider';
import { LODControl } from './lod/LODControl';
export declare class MapView extends Mesh {
    static PLANAR: number;
    static SPHERICAL: number;
    static HEIGHT: number;
    static HEIGHT_SHADER: number;
    static MARTINI: number;
    static TERRAIN: number;
    static mapModes: Map<number, any>;
    lod: LODControl;
    onNodeReady: Function;
    provider: MapProvider;
    heightProvider: MapProvider;
    root: MapNode;
    constructor(root?: (number | MapNode), provider?: MapProvider, heightProvider?: MapProvider, overrideMaterial?: any);
    update(camera: Camera, renderer: WebGLRenderer, scene: Scene): void;
    setRoot(root: (MapNode | number)): void;
    setProvider(provider: MapProvider): void;
    setHeightProvider(heightProvider: MapProvider): void;
    clear(): any;
    getMetaData(): void;
    raycast(raycaster: Raycaster, intersects: any[]): boolean;
}
