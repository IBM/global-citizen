'use strict';
/**
 * Write your transction processor functions here
 */
var NS = 'org.global.citizens.net';
/**
 * createProjectProposal
 * @param {org.global.citizens.net.CreateProjectProposal} createProjectProposal
 * @transaction
 */
function createProjectProposal(txParams) {
  if(!txParams.name || (txParams.name && txParams.name === "")) {
    throw new Error('Invalid Proposal Name!!');
  }
  if(!txParams.aidOrg) {
    throw new Error('Invalid Aid Org!!');
  }
  var factory = getFactory();
  var proposal = null;
  return getAssetRegistry(NS + '.ProjectProposal').then(function (registry) {
    // Create the bond asset.
    proposal = factory.newResource(NS, 'ProjectProposal', Math.random().toString(36).substring(3));
    proposal.name = txParams.name;
    proposal.decription = txParams.decription;
    proposal.fundsRequired = txParams.fundsRequired;
    proposal.status = 'INITIALSTATE';
    proposal.funds = [];
    proposal.aidOrg = txParams.aidOrg;
    // Add the bond asset to the registry.
    return registry.add(proposal);
  }).then(function () {
    return getParticipantRegistry(NS + '.AidOrg');
  }).then(function (aidOrgRegistry) {
    // save the buyer
    txParams.aidOrg.projectProposal.push(proposal);
    return aidOrgRegistry.update(txParams.aidOrg);
  });
}
/**
 * SendProposalToGlobalCitizen
 * @param {org.global.citizens.net.SendProposalToGlobalCitizen} sendProposalToGlobalCitizen
 * @transaction
 */
function sendProposalToGlobalCitizen(txParams) {
  if(!txParams.citizenId || !txParams.proposalId) {
    throw new Error('Invalid input parameters!!');
  }
  txParams.proposalId.status = 'GLOBALCITIZENREVIEW';
  txParams.citizenId.projectProposal.push(txParams.proposalId);
  var factory = getFactory();
  return getAssetRegistry(NS + '.ProjectProposal').then(function (registry) {
    return registry.update(txParams.proposalId);
  }).then(function () {
    return getParticipantRegistry(NS + '.GlobalCitizen');
  }).then(function (registry) {
    return registry.update(txParams.citizenId);
  });
}
/**
 * SendProposalToGovOrg
 * @param {org.global.citizens.net.SendProposalToGovOrg} sendProposalToGovOrg
 * @transaction
 */
function sendProposalToGovOrg(txParams) {
  if(!txParams.proposalId || !txParams.govOrg || (txParams.govOrg && txParams.govOrg.length === 0)) {
    throw new Error('Invalid input parameters!!');
  }
  var factory = getFactory();
  txParams.proposalId.status = 'GOVORGREVIEW';
  return getAssetRegistry(NS + '.ProjectProposal').then(function (registry) {
    return registry.update(txParams.proposalId);
  }).then(function () {
    return getParticipantRegistry(NS + '.GovOrg');
  }).then(function (registry) {
    for(var i = 0; i < txParams.govOrg.length; i++) {
      txParams.govOrg[i].projectProposal.push(txParams.proposalId);
    }
    return registry.updateAll(txParams.govOrg);
  });
}
/**
 * UpdateProposal
 * @param {org.global.citizens.net.UpdateProposal} updateProposal
 * @transaction
 */
function updateProposal(txParams) {
  if(!txParams.govOrgId) {
    throw new Error('Invalid user type!!');
  }
  var factory = getFactory();
  var funding = factory.newConcept(NS, 'Funding');
  var nextDate = new Date();
  var daysToAdd = 0;
  switch(txParams.fundingType) {
  case 'WEEKLY':
    daysToAdd = 7;
    break;
  case 'MONTHLY':
    daysToAdd = 30;
    break;
  case 'SEMIANNUALY':
    daysToAdd = 180;
    break;
  case 'ANNUALY':
    daysToAdd = 365;
    break;
  }
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  funding.fundingType = txParams.fundingType;
  funding.lastFundsReceived = new Date();
  funding.nextFundingDueDate = nextDate;
  funding.approvedFunding = txParams.approvedFunding;
  funding.totalFundsReceived = 0;
  funding.fundsPerInstallment = txParams.fundsPerInstallment;
  //funding.fundsReceivedInCurrentInstallment = 0;
  funding.govOrgId = txParams.govOrgId;
  txParams.proposalId.status = 'PROPOSALFUNDED';
  txParams.proposalId.funds.push(funding);
  txParams.govOrgId.fundedProposals.push(txParams.proposalId);
  return getAssetRegistry(NS + '.ProjectProposal').then(function (registry) {
    return registry.update(txParams.proposalId);
  }).then(function () {
    return getParticipantRegistry(NS + '.GovOrg');
  }).then(function (registry) {
    return registry.update(txParams.govOrgId);
  });
}
/**
 * TransferFunds
 * @param {org.global.citizens.net.TransferFunds} transferFunds
 * @transaction
 */
function transferFunds(txParams) {
  if(!txParams.proposalId || !txParams.govOrgId) {
    throw new Error('Invalid input parameters!!');
  }
  var factory = getFactory();
  var valid = false;
  for(var i = 0; i < txParams.govOrgId.fundedProposals.length; i++) {
    if(txParams.govOrgId.fundedProposals[i].proposalId === txParams.proposalId.proposalId) {
      valid = true;
      break;
    }
  }
  if(!valid) {
    throw new Error('Proposal not funded!!');
  }
  for(var i = 0; i < txParams.proposalId.funds.length; i++) {
    if(txParams.proposalId.funds[i].govOrgId === txParams.govOrgId) {
      txParams.proposalId.funds[i].lastFundsReceived = new Date();
      var daysToAdd = 0;
      switch(txParams.proposalId.funds[i].fundingType) {
      case 'WEEKLY':
        daysToAdd = 7;
        break;
      case 'MONTHLY':
        daysToAdd = 30;
        break;
      case 'SEMIANNUALY':
        daysToAdd = 180;
        break;
      case 'ANNUALY':
        daysToAdd = 365;
        break;
      }
      txParams.proposalId.funds[i].nextFundingDueDate.setDate(txParams.proposalId.funds[i].nextFundingDueDate.getDate() + daysToAdd);
      txParams.proposalId.funds[i].totalFundsReceived += txParams.proposalId.funds[i].fundsPerInstallment;
      break;
    }
  }
  return getAssetRegistry(NS + '.ProjectProposal').then(function (registry) {
    return registry.update(txParams.proposalId);
  });
}