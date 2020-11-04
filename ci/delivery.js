
class TestSuite {
    constructor(coq /* : CoqManager */) {
        this.coq = coq;
        this.dir = './tests';
        this.files = ['sanity.v', 'addons/mathcomp.v', 'addons/elpi.v',
                      'addons/quickchick.v'];
    }

    async toProject() {
        var coq = this.coq;
        await coq.openProject();
        coq.project.clear();
        var v = coq.project.project.volume;
        for (let fn of this.files) {
            var uri = `${this.dir}/${fn}`;
            v.writeFileSync(`/${fn}`, await (await fetch(uri)).text());
        }
        return coq.project.project.fromDirectory('/');
    }

    async run(fn) {
        var coq = this.coq;
        await coq.project.openFile(`/${fn}`);
        await coq.when_ready.promise;
        coq.provider.snippets[0].editor.execCommand('goDocEnd');
        coq.provider.currentFocus = coq.provider.snippets[0];
        coq.goCursor();
    }

    async launch() {
        this.run(this.files[0]);
    }
}
