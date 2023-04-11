import { Vec3 } from "../lib/TSM.js";

class Point {
    constructor(){

    }

    public position: Vec3;
    public neighbors: Vec3[];
    public velocity: Vec3;
    public mass: number;
    public accel: number;
    public damping: number;
}