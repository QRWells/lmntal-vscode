class StateNode {
    inDegree = 0;
    outDegree = 0;
    constructor(public id: string, public state: string) { }

    addInDegree() { this.inDegree++ }
    addOutDegree() { this.outDegree++ }

    getColor() {
        let rgb: number[];
        const from = this.inDegree;
        const to = this.outDegree;
        if (from < to) {
            if (from * 2 < to) {
                rgb = [0, 255 * Math.sqrt(from * 2 / to), 255];
            } else if (from * 2 == to) {
                rgb = [0, 255, 255];
            } else if (from * 2 > to) {
                rgb = [0, 255, 255 * Math.sqrt(to / from - 1)];
            }
        } else if (from == to) {
            rgb = [0, 255, 0];
        } else if (from > to) {
            if (from < to * 2) {
                rgb = [255 * Math.sqrt(from / to - 1), 255, 0];
            } else if (from == to * 2) {
                rgb = [255, 255, 0];
            } else if (from > to * 2) {
                rgb = [255, 255 * Math.sqrt(to * 2 / from), 0];
            }
        }
        const toHex = (n: number) => (("0" + Math.round(n).toString(16)).slice(-2));
        return "#" + rgb!.map(toHex).join("");
    }

    toCy() {
        return {
            group: "nodes",
            data: {
                id: this.id,
                label: this.state
            },
            style: {
                "background-color": this.getColor()
            }
        };
    }
}

export function slim2cy(str: string) {
    let lines = str.split("\n");
    let getNext = () => (lines.shift()!.trim());
    let nodes: { [id: string]: StateNode } = {};
    let ret: any[] = [];
    while (lines.length > 0 && getNext() !== "States") { }
    if (lines.length === 0) return null;
    while (true) {
        let pair = getNext().split("::")
        if (pair.length < 2) break; // corner case:  '::'(some). '::'('::').
        let id = pair.shift()!;
        let state = pair.join('::');
        nodes[id] = new StateNode(id, state);
    }
    while (lines.length > 0 && getNext() !== "Transitions") { }
    if (lines.length === 0) return null;
    let line = getNext();
    if (line.startsWith("init:")) {
        // let state = line.substring(5);
    } else {
        return null;
    }
    if (lines.length === 0) return null;
    while (true) {
        let pair = getNext().split("::")
        if (pair.length < 2) break;
        let source = pair.shift()!;
        let targets = pair.join('::').split(',');
        if (targets.length === 1 && targets[0] === "") continue;
        for (let target of targets) {
            ret.push({
                group: "edges",
                data: { source: source, target: target }
            });
            nodes[target].addInDegree();
            nodes[source].addOutDegree();
        }
    }
    for (let key in nodes) {
        ret.push(nodes[key].toCy());
    }
    return ret;
}
