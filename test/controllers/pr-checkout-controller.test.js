import React from 'react';
import {shallow} from 'enzyme';

import {BarePullRequestCheckoutController} from '../../lib/controllers/pr-checkout-controller';
import {cloneRepository, buildRepository} from '../helpers';
import BranchSet from '../../lib/models/branch-set';
import Branch, {nullBranch} from '../../lib/models/branch';
import RemoteSet from '../../lib/models/remote-set';
import Remote from '../../lib/models/remote';
import {GitError} from '../../lib/git-shell-out-strategy';

describe.skip('PullRequestCheckoutController', function() {
  let localRepository;

  beforeEach(async function() {
    localRepository = await buildRepository(await cloneRepository());
  });

  function buildApp(override = {}) {
    const props = {
      localRepository,
      ...override,
    };

    return <BarePullRequestCheckoutController {...props} />;
  }

  /*
  it('checkout is disabled if the issueish is an issue', function() {
    const wrapper = shallow(buildApp({pullRequestKind: 'Issue'}));
    const op = wrapper.instance().checkoutOp;
    assert.isFalse(op.isEnabled());
    assert.strictEqual(op.getMessage(), 'Cannot check out an issue');
  });
  it('is disabled if the repository is loading or absent', function() {
    const wrapper = shallow(buildApp({}, {isAbsent: true}));
    const op = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op.isEnabled());
    assert.strictEqual(op.getMessage(), 'No repository found');

    wrapper.setProps({isAbsent: false, isLoading: true});
    const op1 = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op1.isEnabled());
    assert.strictEqual(op1.getMessage(), 'Loading');

    wrapper.setProps({isAbsent: false, isLoading: false, isPresent: false});
    const op2 = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op2.isEnabled());
    assert.strictEqual(op2.getMessage(), 'No repository found');
  });

  it('is disabled if the local repository is merging or rebasing', function() {
    const wrapper = shallow(buildApp({}, {isMerging: true}));
    const op0 = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op0.isEnabled());
    assert.strictEqual(op0.getMessage(), 'Merge in progress');

    wrapper.setProps({isMerging: false, isRebasing: true});
    const op1 = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op1.isEnabled());
    assert.strictEqual(op1.getMessage(), 'Rebase in progress');
  });
  it('is disabled if pullRequest.headRepository is null', function() {
    const props = issueishDetailControllerProps({}, {});
    props.repository.pullRequest.headRepository = null;
    const wrapper = shallow(buildApp({}, {...props}));
    const op = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op.isEnabled());
    assert.strictEqual(op.getMessage(), 'Pull request head repository does not exist');
  });


  it('is disabled if the current branch already corresponds to the pull request', function() {
    const upstream = Branch.createRemoteTracking('remotes/origin/feature', 'origin', 'refs/heads/feature');
    const branches = new BranchSet([
      new Branch('current', upstream, upstream, true),
    ]);
    const remotes = new RemoteSet([
      new Remote('origin', 'git@github.com:aaa/bbb.git'),
    ]);

    const wrapper = shallow(buildApp({
      pullRequestHeadRef: 'feature',
      pullRequestHeadRepoOwner: 'aaa',
      pullRequestHeadRepoName: 'bbb',
    }, {
      branches,
      remotes,
    }));

    const op = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op.isEnabled());
    assert.strictEqual(op.getMessage(), 'Current');
  });

  it('recognizes a current branch even if it was pulled from the refs/pull/... ref', function() {
    const upstream = Branch.createRemoteTracking('remotes/origin/pull/123/head', 'origin', 'refs/pull/123/head');
    const branches = new BranchSet([
      new Branch('current', upstream, upstream, true),
    ]);
    const remotes = new RemoteSet([
      new Remote('origin', 'git@github.com:aaa/bbb.git'),
    ]);

    const wrapper = shallow(buildApp({
      repositoryName: 'bbb',
      ownerLogin: 'aaa',
      pullRequestHeadRef: 'feature',
      issueishNumber: 123,
      pullRequestHeadRepoOwner: 'ccc',
      pullRequestHeadRepoName: 'ddd',
    }, {
      branches,
      remotes,
    }));

    const op = wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp');
    assert.isFalse(op.isEnabled());
    assert.strictEqual(op.getMessage(), 'Current');
  });

  it('creates a new remote, fetches a PR branch, and checks it out into a new local branch', async function() {
    const upstream = Branch.createRemoteTracking('remotes/origin/current', 'origin', 'refs/heads/current');
    const branches = new BranchSet([
      new Branch('current', upstream, upstream, true),
    ]);
    const remotes = new RemoteSet([
      new Remote('origin', 'git@github.com:aaa/bbb.git'),
    ]);

    const addRemote = sinon.stub().resolves(new Remote('ccc', 'git@github.com:ccc/ddd.git'));
    const fetch = sinon.stub().resolves();
    const checkout = sinon.stub().resolves();

    const wrapper = shallow(buildApp({
      issueishNumber: 456,
      pullRequestHeadRef: 'feature',
      pullRequestHeadRepoOwner: 'ccc',
      pullRequestHeadRepoName: 'ddd',
    }, {
      branches,
      remotes,
      addRemote,
      fetch,
      checkout,
    }));

    sinon.spy(reporterProxy, 'incrementCounter');
    await wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp').run();

    assert.isTrue(addRemote.calledWith('ccc', 'git@github.com:ccc/ddd.git'));
    assert.isTrue(fetch.calledWith('refs/heads/feature', {remoteName: 'ccc'}));
    assert.isTrue(checkout.calledWith('pr-456/ccc/feature', {
      createNew: true,
      track: true,
      startPoint: 'refs/remotes/ccc/feature',
    }));

    assert.isTrue(reporterProxy.incrementCounter.calledWith('checkout-pr'));
  });

  it('fetches a PR branch from an existing remote and checks it out into a new local branch', async function() {
    const branches = new BranchSet([
      new Branch('current', nullBranch, nullBranch, true),
    ]);
    const remotes = new RemoteSet([
      new Remote('origin', 'git@github.com:aaa/bbb.git'),
      new Remote('existing', 'git@github.com:ccc/ddd.git'),
    ]);

    const fetch = sinon.stub().resolves();
    const checkout = sinon.stub().resolves();

    const wrapper = shallow(buildApp({
      issueishNumber: 789,
      pullRequestHeadRef: 'clever-name',
      pullRequestHeadRepoOwner: 'ccc',
      pullRequestHeadRepoName: 'ddd',
    }, {
      branches,
      remotes,
      fetch,
      checkout,
    }));

    sinon.spy(reporterProxy, 'incrementCounter');
    await wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp').run();

    assert.isTrue(fetch.calledWith('refs/heads/clever-name', {remoteName: 'existing'}));
    assert.isTrue(checkout.calledWith('pr-789/ccc/clever-name', {
      createNew: true,
      track: true,
      startPoint: 'refs/remotes/existing/clever-name',
    }));

    assert.isTrue(reporterProxy.incrementCounter.calledWith('checkout-pr'));
  });

  it('checks out an existing local branch that corresponds to the pull request', async function() {
    const currentUpstream = Branch.createRemoteTracking('remotes/origin/current', 'origin', 'refs/heads/current');
    const branches = new BranchSet([
      new Branch('current', currentUpstream, currentUpstream, true),
      new Branch('existing', Branch.createRemoteTracking('remotes/upstream/pull/123', 'upstream', 'refs/heads/yes')),
      new Branch('wrong/remote', Branch.createRemoteTracking('remotes/wrong/pull/123', 'wrong', 'refs/heads/yes')),
      new Branch('wrong/ref', Branch.createRemoteTracking('remotes/upstream/pull/123', 'upstream', 'refs/heads/no')),
    ]);
    const remotes = new RemoteSet([
      new Remote('origin', 'git@github.com:aaa/bbb.git'),
      new Remote('upstream', 'git@github.com:ccc/ddd.git'),
      new Remote('wrong', 'git@github.com:eee/fff.git'),
    ]);

    const pull = sinon.stub().resolves();
    const checkout = sinon.stub().resolves();

    const wrapper = shallow(buildApp({
      issueishNumber: 456,
      pullRequestHeadRef: 'yes',
      pullRequestHeadRepoOwner: 'ccc',
      pullRequestHeadRepoName: 'ddd',
    }, {
      branches,
      remotes,
      fetch,
      pull,
      checkout,
    }));

    sinon.spy(reporterProxy, 'incrementCounter');
    await wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp').run();

    assert.isTrue(checkout.calledWith('existing'));
    assert.isTrue(pull.calledWith('refs/heads/yes', {remoteName: 'upstream', ffOnly: true}));
    assert.isTrue(reporterProxy.incrementCounter.calledWith('checkout-pr'));
  });

  it('squelches git errors', async function() {
    const addRemote = sinon.stub().rejects(new GitError('handled by the pipeline'));
    const wrapper = shallow(buildApp({}, {addRemote}));

    // Should not throw
    await wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp').run();
    assert.isTrue(addRemote.called);
  });

  it('propagates non-git errors', async function() {
    const addRemote = sinon.stub().rejects(new Error('not handled by the pipeline'));
    const wrapper = shallow(buildApp({}, {addRemote}));

    await assert.isRejected(
      wrapper.find('ForwardRef(Relay(BarePullRequestDetailView))').prop('checkoutOp').run(),
      /not handled by the pipeline/,
    );
    assert.isTrue(addRemote.called);
  });
  */
});