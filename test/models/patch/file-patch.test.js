import {TextBuffer} from 'atom';

import FilePatch from '../../../lib/models/patch/file-patch';
import {Unchanged, Addition, Deletion, NoNewline} from '../../../lib/models/patch/region';
    const buffer = new TextBuffer({text: '0000\n0001\n0002\n'});
    const layers = buildLayers(buffer);
        oldStartRow: 2, oldRowCount: 1, newStartRow: 2, newRowCount: 3,
        marker: markRange(layers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(layers.unchanged, 0)),
          new Addition(markRange(layers.addition, 1, 2)),
    const patch = new Patch({status: 'modified', hunks, buffer, layers});
    assert.strictEqual(filePatch.getByteSize(), 15);
    assert.strictEqual(filePatch.getBuffer().getText(), '0000\n0001\n0002\n');

    assert.strictEqual(filePatch.getHunkAt(1), hunks[0]);

    assert.deepEqual(filePatch.getFirstChangeRange(), [[1, 0], [1, Infinity]]);

    const nBuffer = new TextBuffer({text: '0001\n0002\n'});
    const nLayers = buildLayers(nBuffer);
    const nHunks = [
      new Hunk({
        oldStartRow: 3, oldRowCount: 1, newStartRow: 3, newRowCount: 2,
        marker: markRange(nLayers.hunk, 0, 1),
        regions: [
          new Unchanged(markRange(nLayers.unchanged, 0)),
          new Addition(markRange(nLayers.addition, 1)),
        ],
      }),
    ];
    const nPatch = new Patch({status: 'modified', hunks: nHunks, buffer: nBuffer, layers: nLayers});
    const nFilePatch = new FilePatch(oldFile, newFile, nPatch);

    const range = nFilePatch.getNextSelectionRange(filePatch, new Set([1]));
    assert.deepEqual(range, [[1, 0], [1, Infinity]]);
    const buffer = new TextBuffer();
    const layers = buildLayers(buffer);
    const patch = new Patch({status: 'modified', hunks: [], buffer, layers});
    const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n0005\n0006\n0007\n0008\n0009\n'});
    const layers = buildLayers(buffer);
        oldStartRow: 1, oldRowCount: 0, newStartRow: 1, newRowCount: 0,
        marker: markRange(layers.hunk, 0, 9),
        regions: [
          new Unchanged(markRange(layers.unchanged, 0)),
          new Addition(markRange(layers.addition, 1)),
          new Unchanged(markRange(layers.unchanged, 2)),
          new Addition(markRange(layers.addition, 3)),
          new Deletion(markRange(layers.deletion, 4)),
          new Addition(markRange(layers.addition, 5, 6)),
          new Deletion(markRange(layers.deletion, 7)),
          new Addition(markRange(layers.addition, 8)),
          new Unchanged(markRange(layers.unchanged, 9)),
    const patch = new Patch({status: 'modified', hunks, buffer, layers});
      [[1, 0], [1, 4]],
      [[3, 0], [3, 4]],
      [[5, 0], [6, 4]],
      [[8, 0], [8, 4]],
      [[4, 0], [4, 4]],
      [[7, 0], [7, 4]],
    const buffer = new TextBuffer();
    const layers = buildLayers(buffer);
    const patch = new Patch({status: 'modified', hunks: [], buffer, layers});
    const buffer = new TextBuffer({text: '0000\n No newline at end of file\n'});
    const layers = buildLayers(buffer);
        oldStartRow: 1, oldRowCount: 0, newStartRow: 1, newRowCount: 0,
        marker: markRange(layers.hunk, 0, 1),
        regions: [
          new Addition(markRange(layers.addition, 0)),
          new NoNewline(markRange(layers.noNewline, 1)),
    const patch = new Patch({status: 'modified', hunks, buffer, layers});
      [[1, 0], [1, 26]],
    ]);
  });

  it('adopts a buffer and layers from a prior FilePatch', function() {
    const oldFile = new File({path: 'a.txt', mode: '100755'});
    const newFile = new File({path: 'b.txt', mode: '100755'});

    const prevBuffer = new TextBuffer({text: '0000\n0001\n0002\n'});
    const prevLayers = buildLayers(prevBuffer);
    const prevHunks = [
      new Hunk({
        oldStartRow: 2, oldRowCount: 2, newStartRow: 2, newRowCount: 3,
        marker: markRange(prevLayers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(prevLayers.unchanged, 0)),
          new Addition(markRange(prevLayers.addition, 1)),
          new Unchanged(markRange(prevLayers.unchanged, 2)),
        ],
      }),
    ];
    const prevPatch = new Patch({status: 'modified', hunks: prevHunks, buffer: prevBuffer, layers: prevLayers});
    const prevFilePatch = new FilePatch(oldFile, newFile, prevPatch);

    const nextBuffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n No newline at end of file'});
    const nextLayers = buildLayers(nextBuffer);
    const nextHunks = [
      new Hunk({
        oldStartRow: 2, oldRowCount: 2, newStartRow: 2, newRowCount: 3,
        marker: markRange(nextLayers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(nextLayers.unchanged, 0)),
          new Addition(markRange(nextLayers.addition, 1)),
          new Unchanged(markRange(nextLayers.unchanged, 2)),
        ],
      }),
      new Hunk({
        oldStartRow: 10, oldRowCount: 2, newStartRow: 11, newRowCount: 1,
        marker: markRange(nextLayers.hunk, 3, 5),
        regions: [
          new Unchanged(markRange(nextLayers.unchanged, 3)),
          new Deletion(markRange(nextLayers.deletion, 4)),
          new NoNewline(markRange(nextLayers.noNewline, 5)),
        ],
      }),
    ];
    const nextPatch = new Patch({status: 'modified', hunks: nextHunks, buffer: nextBuffer, layers: nextLayers});
    const nextFilePatch = new FilePatch(oldFile, newFile, nextPatch);

    nextFilePatch.adoptBufferFrom(prevFilePatch);

    assert.strictEqual(nextFilePatch.getBuffer(), prevBuffer);
    assert.strictEqual(nextFilePatch.getHunkLayer(), prevLayers.hunk);
    assert.strictEqual(nextFilePatch.getUnchangedLayer(), prevLayers.unchanged);
    assert.strictEqual(nextFilePatch.getAdditionLayer(), prevLayers.addition);
    assert.strictEqual(nextFilePatch.getDeletionLayer(), prevLayers.deletion);
    assert.strictEqual(nextFilePatch.getNoNewlineLayer(), prevLayers.noNewline);

    const rangesFrom = layer => layer.getMarkers().map(marker => marker.getRange().serialize());
    assert.deepEqual(rangesFrom(nextFilePatch.getHunkLayer()), [
      [[0, 0], [2, 4]],
      [[3, 0], [5, 26]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getUnchangedLayer()), [
      [[0, 0], [0, 4]],
      [[2, 0], [2, 4]],
      [[3, 0], [3, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getAdditionLayer()), [
      [[1, 0], [1, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getDeletionLayer()), [
      [[4, 0], [4, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getNoNewlineLayer()), [
      [[5, 0], [5, 26]],
      const buffer = new TextBuffer();
      const layers = buildLayers(buffer);
      emptyPatch = new Patch({status: 'modified', hunks: [], buffer, layers});
    const buffer0 = new TextBuffer({text: '0'});
    const layers0 = buildLayers(buffer0);
    const patch0 = new Patch({status: 'modified', hunks: [], buffer: buffer0, layers: layers0});
    const buffer1 = new TextBuffer({text: '1'});
    const layers1 = buildLayers(buffer1);
    const patch1 = new Patch({status: 'modified', hunks: [], buffer: buffer1, layers: layers1});
      const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n'});
      const layers = buildLayers(buffer);
          oldStartRow: 5, oldRowCount: 3, newStartRow: 5, newRowCount: 4,
          marker: markRange(layers.hunk, 0, 4),
          regions: [
            new Unchanged(markRange(layers.unchanged, 0)),
            new Addition(markRange(layers.addition, 1, 2)),
            new Deletion(markRange(layers.deletion, 3)),
            new Unchanged(markRange(layers.unchanged, 4)),
      const patch = new Patch({status: 'modified', hunks, buffer, layers});
      assert.strictEqual(stagedPatch.getBuffer().getText(), '0000\n0001\n0003\n0004\n');
          regions: [
            {kind: 'unchanged', string: ' 0000\n', range: [[0, 0], [0, 4]]},
            {kind: 'addition', string: '+0001\n', range: [[1, 0], [1, 4]]},
            {kind: 'deletion', string: '-0003\n', range: [[2, 0], [2, 4]]},
            {kind: 'unchanged', string: ' 0004\n', range: [[3, 0], [3, 4]]},
        const buffer = new TextBuffer({text: '0000\n0001\n0002\n'});
        const layers = buildLayers(buffer);
            oldStartRow: 1, oldRowCount: 3, newStartRow: 1, newRowCount: 0,
            marker: markRange(layers.hunk, 0, 2),
            regions: [
              new Deletion(markRange(layers.deletion, 0, 2)),
        const patch = new Patch({status: 'deleted', hunks, buffer, layers});
        assert.strictEqual(stagedPatch.getBuffer().getText(), '0000\n0001\n0002\n');
            regions: [
              {kind: 'unchanged', string: ' 0000\n', range: [[0, 0], [0, 4]]},
              {kind: 'deletion', string: '-0001\n-0002\n', range: [[1, 0], [2, 4]]},
        assert.strictEqual(stagedPatch.getBuffer().getText(), '0000\n0001\n0002\n');
            regions: [
              {kind: 'deletion', string: '-0000\n-0001\n-0002\n', range: [[0, 0], [2, 4]]},
        const buffer = new TextBuffer({text: '0000\n0001\n0002\n'});
        const layers = buildLayers(buffer);
            oldStartRow: 1, oldRowCount: 3, newStartRow: 1, newRowCount: 0,
            marker: markRange(layers.hunk, 0, 2),
            regions: [
              new Deletion(markRange(layers.deletion, 0, 2)),
        const patch = new Patch({status: 'deleted', hunks, buffer, layers});
    const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n0005\n'});
    const layers = buildLayers(buffer);
        oldStartRow: 10, oldRowCount: 2, newStartRow: 10, newRowCount: 3,
        marker: markRange(layers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(layers.unchanged, 0)),
          new Addition(markRange(layers.addition, 1)),
          new Unchanged(markRange(layers.unchanged, 2)),
        oldStartRow: 20, oldRowCount: 3, newStartRow: 19, newRowCount: 2,
        marker: markRange(layers.hunk, 3, 5),
        regions: [
          new Unchanged(markRange(layers.unchanged, 3)),
          new Deletion(markRange(layers.deletion, 4)),
          new Unchanged(markRange(layers.unchanged, 5)),
    const patch = new Patch({status: 'modified', hunks, buffer, layers});
    assert.strictEqual(stagedPatch.getBuffer().getText(), '0003\n0004\n0005\n');
        regions: [
          {kind: 'unchanged', string: ' 0003\n', range: [[0, 0], [0, 4]]},
          {kind: 'deletion', string: '-0004\n', range: [[1, 0], [1, 4]]},
          {kind: 'unchanged', string: ' 0005\n', range: [[2, 0], [2, 4]]},
      const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n'});
      const layers = buildLayers(buffer);
          oldStartRow: 5, oldRowCount: 3, newStartRow: 5, newRowCount: 4,
          marker: markRange(layers.hunk, 0, 4),
          regions: [
            new Unchanged(markRange(layers.unchanged, 0)),
            new Addition(markRange(layers.addition, 1, 2)),
            new Deletion(markRange(layers.deletion, 3)),
            new Unchanged(markRange(layers.unchanged, 4)),
      const patch = new Patch({status: 'modified', hunks, buffer, layers});
      assert.strictEqual(unstagedPatch.getBuffer().getText(), '0000\n0001\n0002\n0003\n0004\n');
          regions: [
            {kind: 'unchanged', string: ' 0000\n', range: [[0, 0], [0, 4]]},
            {kind: 'deletion', string: '-0001\n', range: [[1, 0], [1, 4]]},
            {kind: 'unchanged', string: ' 0002\n', range: [[2, 0], [2, 4]]},
            {kind: 'addition', string: '+0003\n', range: [[3, 0], [3, 4]]},
            {kind: 'unchanged', string: ' 0004\n', range: [[4, 0], [4, 4]]},
        const buffer = new TextBuffer({text: '0000\n0001\n0002\n'});
        const layers = buildLayers(buffer);
            oldStartRow: 1, oldRowCount: 0, newStartRow: 1, newRowCount: 3,
            marker: markRange(layers.hunk, 0, 2),
            regions: [
              new Addition(markRange(layers.addition, 0, 2)),
        addedPatch = new Patch({status: 'added', hunks, buffer, layers});
            regions: [
              {kind: 'unchanged', string: ' 0000\n 0001\n', range: [[0, 0], [1, 4]]},
              {kind: 'deletion', string: '-0002\n', range: [[2, 0], [2, 4]]},
            regions: [
              {kind: 'deletion', string: '-0000\n-0001\n-0002\n', range: [[0, 0], [2, 4]]},
            regions: [
              {kind: 'deletion', string: '-0000\n-0001\n-0002\n', range: [[0, 0], [2, 4]]},
    const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n0005\n'});
    const layers = buildLayers(buffer);
        oldStartRow: 10, oldRowCount: 2, newStartRow: 10, newRowCount: 3,
        marker: markRange(layers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(layers.unchanged, 0)),
          new Addition(markRange(layers.addition, 1)),
          new Unchanged(markRange(layers.unchanged, 2)),
        oldStartRow: 20, oldRowCount: 3, newStartRow: 19, newRowCount: 2,
        marker: markRange(layers.hunk, 3, 5),
        regions: [
          new Unchanged(markRange(layers.unchanged, 3)),
          new Deletion(markRange(layers.deletion, 4)),
          new Unchanged(markRange(layers.unchanged, 5)),
    const patch = new Patch({status: 'modified', hunks, buffer, layers});
    assert.strictEqual(unstagedPatch.getBuffer().getText(), '0000\n0001\n0002\n');
        regions: [
          {kind: 'unchanged', string: ' 0000\n', range: [[0, 0], [0, 4]]},
          {kind: 'deletion', string: '-0001\n', range: [[1, 0], [1, 4]]},
          {kind: 'unchanged', string: ' 0002\n', range: [[2, 0], [2, 4]]},
      const buffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n0005\n0006\n0007\n'});
      const layers = buildLayers(buffer);
          oldStartRow: 10, oldRowCount: 4, newStartRow: 10, newRowCount: 3,
          marker: markRange(layers.hunk, 0, 4),
          regions: [
            new Unchanged(markRange(layers.unchanged, 0)),
            new Addition(markRange(layers.addition, 1)),
            new Deletion(markRange(layers.deletion, 2, 3)),
            new Unchanged(markRange(layers.unchanged, 4)),
          oldStartRow: 20, oldRowCount: 2, newStartRow: 20, newRowCount: 3,
          marker: markRange(layers.hunk, 5, 7),
          regions: [
            new Unchanged(markRange(layers.unchanged, 5)),
            new Addition(markRange(layers.addition, 6)),
            new Unchanged(markRange(layers.unchanged, 7)),
      const patch = new Patch({status: 'modified', hunks, buffer, layers});
      const buffer = new TextBuffer({text: '0000\n0001\n No newline at end of file\n'});
      const layers = buildLayers(buffer);
          oldStartRow: 1, oldRowCount: 1, newStartRow: 1, newRowCount: 2,
          marker: markRange(layers.hunk, 0, 2),
          regions: [
            new Unchanged(markRange(layers.unchanged, 0)),
            new Addition(markRange(layers.addition, 1)),
            new NoNewline(markRange(layers.noNewline, 2)),
      const patch = new Patch({status: 'modified', hunks, buffer, layers});
        const buffer = new TextBuffer({text: '0000\n0001\n'});
        const layers = buildLayers(buffer);
            oldStartRow: 1, oldRowCount: 0, newStartRow: 1, newRowCount: 2,
            marker: markRange(layers.hunk, 0, 1),
            regions: [
              new Addition(markRange(layers.addition, 0, 1)),
        const patch = new Patch({status: 'added', hunks, buffer, layers});
        const buffer = new TextBuffer({text: '0000\n0001\n'});
        const layers = buildLayers(buffer);
            oldStartRow: 1, oldRowCount: 2, newStartRow: 1, newRowCount: 0,
            markers: markRange(layers.hunk, 0, 1),
            regions: [
              new Deletion(markRange(layers.deletion, 0, 1)),
        const patch = new Patch({status: 'deleted', hunks, buffer, layers});
    const buffer = new TextBuffer({text: '0\n1\n2\n3\n'});
    const marker = markRange(buffer, 0, 1);

    const nullFilePatch = FilePatch.createNull();
    assert.strictEqual(nullFilePatch.getBuffer().getText(), '');
    assert.lengthOf(nullFilePatch.getHunkLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getUnchangedLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getAdditionLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getDeletionLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getNoNewlineLayer().getMarkers(), 0);
    assert.isFalse(nullFilePatch.getStagePatchForHunk(new Hunk({regions: [], marker})).isPresent());
    assert.isFalse(nullFilePatch.getUnstagePatchForHunk(new Hunk({regions: [], marker})).isPresent());

function buildLayers(buffer) {
  return {
    hunk: buffer.addMarkerLayer(),
    unchanged: buffer.addMarkerLayer(),
    addition: buffer.addMarkerLayer(),
    deletion: buffer.addMarkerLayer(),
    noNewline: buffer.addMarkerLayer(),
  };
}

function markRange(buffer, start, end = start) {
  return buffer.markRange([[start, 0], [end, Infinity]]);
}