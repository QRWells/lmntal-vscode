export class DataAtomID {
    id = 0;
    inc() { return this.id++ }
}

export class Membrane {
    id: number;
    name: string;
    atoms: Atom[];
    membranes: Membrane[];
    constructor(mem: Membrane) {
        this.id = mem.id;
        this.name = mem.name;
        this.atoms = [];
        for (let atom of mem.atoms) {
            this.atoms.push(new Atom(atom));
        }
        this.membranes = [];
        for (let memb of mem.membranes) {
            this.membranes.push(new Membrane(memb));
        }
    }
    isGlobalRoot() {
        return this.id === 1;
    }
    getIDAsParent() {
        return this.isGlobalRoot() ? undefined : this.id;
    }
    toCy(visited: number[], hlinkIDs: number[], nextDataAtomID: DataAtomID, proxyMap: { [id: number]: Link }, parent?: Membrane) {
        let ret: any[] = [];
        if (parent) {
            ret.push({
                group: "nodes",
                data: {
                    id: this.id.toString(),
                    parent: parent.getIDAsParent(),
                    label: this.name
                },
                classes: "membrane"
            });
        }
        for (let atom of this.atoms) {
            Array.prototype.push.apply(ret, atom.toCy(visited, hlinkIDs, nextDataAtomID, proxyMap, this));
        }
        for (let mem of this.membranes) {
            Array.prototype.push.apply(ret, mem.toCy(visited, hlinkIDs, nextDataAtomID, proxyMap, this));
        }
        return ret;
    }
    getProxyMap(map: { [id: number]: Link }): { [id: number]: Link } {
        for (let atom of this.atoms) {
            if (atom.isProxy()) {
                let partner = atom.links[0].getNumberData();
                let link = atom.links[1];
                map[partner] = link;
            }
        }
        for (let mem of this.membranes) {
            mem.getProxyMap(map);
        }
        return map;
    }
}

export class Atom {
    id: number;
    name: string;
    links: Link[];
    constructor(atom: Atom) {
        this.id = atom.id;
        this.name = atom.name;
        this.links = [];
        for (let link of atom.links) {
            this.links.push(new Link(link));
        }
    }
    toCy(visited: number[], hlinkIDs: number[], nextDataAtomID: DataAtomID, proxyMap: { [id: number]: Link }, parent?: Membrane) {
        let ret: any[] = [];
        if (this.isProxy()) return [];
        ret.push({
            group: "nodes",
            data: {
                id: this.id.toString(),
                parent: parent!.getIDAsParent(),
                label: this.name
            },
            classes: "normal"
        });
        let selfloop = false; // selfloopの片割れを発見済みか？
        for (let link of this.links) {
            let res = link.toCy(visited, hlinkIDs, nextDataAtomID, proxyMap, parent);
            if (res !== null) {
                Array.prototype.push.apply(ret, res.data);
                if (parseInt(res.link) === this.id) selfloop = !selfloop;

                if (!selfloop) {
                    ret.push({
                        group: "edges",
                        data: {
                            source: this.id.toString(),
                            target: res.link
                        }
                    });
                }
            }
        }
        visited.push(this.id);
        return ret;
    }
    isProxy() { return (this.name === "$in" || this.name === "$out") && this.links.length === 2 }
}

export class Link {
    attr: number;
    data: number | string;
    constructor(link: Link) {
        this.attr = link.attr;
        this.data = link.data;
    }
    // link: 接続先ノードのID, data: elements
    toCy(visited: number[], hlinkIDs: number[], nextDataAtomID: DataAtomID, proxyMap: { [id: number]: Link }, parent?: Membrane): { link: string, data: any[] } | null {
        let link: Link = this;
        while (link.attr === 1 && proxyMap[link.data as number]) {
            // connected to proxy
            link = proxyMap[link.data as number];
        }
        if (link.attr < 128) {
            // normal link
            if (visited.includes(link.getNumberData())) {
                // already visited
                return null
            } else {
                return { link: link.getStringData(), data: [] }
            }
        } else if (link.attr === 138) {
            // hyper link
            const id = "hlink_" + link.getNumberData();
            if (hlinkIDs.includes(link.getNumberData())) {
                // already exists
                return { link: id, data: [] }
            } else {
                hlinkIDs.push(link.getNumberData())
                return {
                    link: id,
                    data: [{
                        group: "nodes",
                        data: {
                            id: id,
                            parent: parent!.getIDAsParent(),
                            label: link.getStringData()
                        },
                        classes: "hlink"
                    }]
                }
            }
        } else {
            // data atom
            const classMap: { [id: number]: string } = {
                128: "int",
                129: "double",
                131: "string",
                132: "const_string",
                133: "const_double",
                // 138: "hlink"
            }
            const id = "data_" + nextDataAtomID.inc();
            return {
                link: id,
                data: [{
                    group: "nodes",
                    data: {
                        id: id,
                        parent: parent!.getIDAsParent(),
                        label: link.getStringData()
                    },
                    classes: classMap[link.attr]
                }]
            }
        }
    }
    getNumberData(): number {
        if (typeof this.data === "number") {
            return this.data;
        } else {
            return parseInt(this.data);
        }
    }
    getStringData(): string {
        if (typeof this.data === "number") {
            return this.data.toString();
        } else {
            return this.data;
        }
    }
}

export function mem2cy(mem: Membrane) {
    return mem.toCy([], [], new DataAtomID(), mem.getProxyMap({}));
}
