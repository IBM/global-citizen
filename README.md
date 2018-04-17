# Global-citizen

The goal here is to build a 3-member blockchain application using the IBM Blockchain Platform, consisting of the following entities: an organization representing a government entity, an organization representing an NGO focused on the provision of aid, and an organization representing Global Citizen.

## Prerequisites

1. Free [IBM Cloud account](https://www.ibm.com/cloud/)

2. [NPM](https://www.npmjs.com/) and Node installed (node version 8.10.0)

3. If you have used other versions of composer-cli, or have deployed a .bna file before, run these commands
```
npm uninstall -g composer-cli
npm uninstall -g composer-rest-server
rm -rf ~/.composer
rm *.card
rm -rf credentials/
```

4. Install composer-cli
```bash
npm install -g composer-cli@0.18.1
```

## Steps
1. [Generate the Business Network Archive (BNA)](#1-generate-the-business-network-archive-bna)

2. [Test Business Network Archive using Composer Playground](#2-test-business-network-archive-usin-composer-playground)

3. [Create Blockchain Service](#3-create-blockchain-service)

4. [Get the secret](#4-get-the-secret)

5. [Use secret to get certificates from the certificate authority](#5-use-secret-to-get-certificates-from-the-certificate-authority)

6. [Use admin-pub.pem file to add certificates to the peers](#6-use-admin-pub.pem-file-to-add-certificates-to-the-peers)

7. [Create admin business network card](#7-create-admin-business-network-card)

8. [Install runtime and start the network](#8-install-runtime-and-start-the-network)

9. [Create a new business network card](#9-create-a-new-business-network-card)

10. [Create the composer-rest-server to interact with the business network](#10-create-the-composer-rest-server-to-interact-with-the-business-network)

## 1. Generate the Business Network Archive (BNA)

First we need to clone a repo that contains the three components that are needed to make a BNA file: a logic file(**.js**) , a model file(**.cto**), and an access control(**.acl**) file. To check that the structure of the files is valid, you can now generate a Business Network Archive (BNA) file for your business network definition. The BNA file is the deployable unit -- a file that can be deployed to the Composer runtime for execution.

Clone the repo which has these three files, and a fully functioning business network
```bash
git clone https://github.com/IBM/global-citizen.git
```

Use the following command to generate the network archive:
```bash
cd global-citizen
npm install
```

You should see the following output:
```bash
Creating Business Network Archive


Looking for package.json of Business Network Definition
	Input directory: /Users/ishan/Documents/proj/global-citizens/global-citizens-network/global-citizen

Found:
	Description: This pattern should be able to Construct a 3-member blockchain application using the IBM Blockchain Platform, consisting of the following entities: an organization representing a government entity, an organization representing an NGO focused on the provision of aid, and an organization representing Global Citizen.
	Name: global-citizens-network
	Identifier: global-citizens-network@0.0.1

Written Business Network Definition Archive file to
Output file: ./dist/global-citizens-network.bna

Command succeeded
```

Now you should have a BNA file, (global-citizens-network.bna), that is in your `global-citizens/dist` directory.

## 2. Test Business Network Archive using Composer Playground

Open [Composer Playground](http://composer-playground.mybluemix.net/), by default the Basic Sample Network is imported.
If you have previously used Playground, be sure to clear your browser local storage by running `localStorage.clear()` in your browser Console.

Navigate to Composer Playground url in browser and click on `Deploy a new business network`
![](images/1.png)

Click on `Drop here to upload or browser` to import the `global-citizens-network.bna` file
![](images/2.png)

Click on `Deploy` to deploy the global-citizen business network.
![](images/3.png)

`Admin card` for global-citizen business network is created in Composer Playground.
![](images/4.png)

Click on `Connect now` to connect to global-citizen business network
![](images/5.png)

>You can also setup [Composer Playground locally](https://hyperledger.github.io/composer/installing/using-playground-locally.html).

To test your Business Network Definition, first click on the **Test** tab:

In the `AidOrg` participant registry, create a new participant. Make sure you click on the `AidOrg` tab on the far left-hand side first and click on `Create New Participant` button
![](images/6.png)

Fill the details for `AidOrg` participant and click on `Create New`
![](images/7.png)

New `AidOrg` participant created in participant registry. Similarly create the other participants for the network.
![](images/8.png)


Connection profiles contain the information necessary to connect to a fabric. Business network cards combine a connection profile, identity, and certificates to allow a connection to a business network in Hyperledger Composer Playground.

Now we are ready to add **Network Cards** for the participants in network. Do this by first clicking on the `admin` tab and select `ID Registry` to issue **new ids** to the participants and add the ids to the wallet.
Please follow the instructions as shown in the images below:
![](images/9.png)

![](images/10.png)

![](images/11.png)

![](images/12.png)

Click on `Use Now` to select the `AidOrg` participant registry to perform transactions on network.
![](images/13.png)

Submit `CreateProjectProposal` transaction.
```
{
  "$class": "org.global.citizens.net.CreateProjectProposal",
  "name": "child care",
  "decription": "child care fund",
  "fundsRequired": 100000,
  "aidOrg": "resource:org.global.citizens.net.AidOrg#aid"
}
```
![](images/14.png)

New project proposal is created in Asset Registry.
![](images/15.png)

Submit `SendProposalToGlobalCitizen` transaction to send the proposal to global citizen to get the funds for the project.
```
{
  "$class": "org.global.citizens.net.SendProposalToGlobalCitizen",
  "citizenId": "resource:org.global.citizens.net.GlobalCitizen#gc",
  "proposalId": "resource:org.global.citizens.net.ProjectProposal#<ProjectProposal ID>"
}
```
![](images/16.png)

Global Citizen participant registry gets update with the new proposal request.
![](images/17.png)

Global Citizen reviews the proposal. After successful verification it submits a`SendProposalToGovOrg` transaction to get funds for the project proposal from government organizations.
```
{
  "$class": "org.global.citizens.net.SendProposalToGovOrg",
  "govOrg": ["resource:org.global.citizens.net.GovOrg#gov"],
  "proposalId": "resource:org.global.citizens.net.ProjectProposal#<ProjectProposal ID>"
}
```
![](images/19.png)

Government organizations reviews the proposal. After reviewing if they decide to fund the project then they submit a `UpdateProposal` transaction to update the project proposal asset.
```
{
  "$class": "org.global.citizens.net.UpdateProposal",
  "govOrgId": "resource:org.global.citizens.net.GovOrg#gov",
  "proposalId": "resource:org.global.citizens.net.ProjectProposal#<ProjectProposal ID>",
  "fundingType": "WEEKLY",
  "approvedFunding": 100000,
  "fundsPerInstallment": 1000
}
```
![](images/20.png)

![](images/21.png)

![](images/22.png)

Government organizations periodically sends the funds to project by submitting `TransferFunds` transaction.
```
{
  "$class": "org.global.citizens.net.TransferFunds",
  "govOrgId": "resource:org.global.citizens.net.GovOrg#gov",
  "proposalId": "resource:org.global.citizens.net.ProjectProposal#<ProjectProposal ID>"
}
```
![](images/23.png)

![](images/24.png)

## 3. Create Blockchain Service

1. In your browser go to your shiny new [IBM Cloud account](https://console.bluemix.net/dashboard/apps)

2. Create a blockchain service:
![](images/setup.gif)

## 4. Get the secret

1. Launch your blockchain service, and click on connection profile, and view as raw JSON

2. Scroll all the way down until you see `registrar` and then under `enrollId` will be `enrollSecret`. Copy this secret, we will need it for the next step
![](images/connection.gif)

## 5.	Use secret to get certificates from the certificate authority

1. Go back and instead of viewing as raw JSON, download the connection profile.

2. Rename the downloaded JSON file to `connection-profile.json`

3. Move the connection-profile.json file to the `global-citizen` directory

4. Using the `enrollSecret` from the previous step issue this command to create a business network card for the certificate authority (CA).
```bash
composer card create -f ca.card -p connection-profile.json -u admin -s <enrollSecret>
```

5. Import the card with this command
```bash
composer card import -f ca.card -n ca
```

## 6. Use admin-pub.pem file to add certificates to the peers

1. Back in the blockchain service, click on the members tab, then add certificate. Go to your `global-citizen/credentials` directory, and copy and paste the contents of the `admin-pub.pem` file in the certificate box. Submit the certificate and restart the peers.
![](images/admin-pub.gif)
>Note: restarting the peers takes a minute.

2. Next, we need to synchronize the certificates of the channel. From our blockchain service, under `my network` click on `Channels` and then the three-dot button. Then click `Sync Certificate`.
![](images/sync-certs.gif)

## 7. Create admin business network card

1. Now that we have synced certificates with our peers, we can install the Hyperledger Composer runtime and start the network by creating an admin card. Create the admin card with the channel admin and peer admin roles with the following command:
```bash
composer card create -f adminCard.card -p connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem --role PeerAdmin --role ChannelAdmin
```

2. Import the card created from the previous command:
```bash
composer card import -f adminCard.card -n adminCard
```

## 8. Install runtime and start the network

1. Copy and paste the global-citizens-network.bna file to the `global-citizen` directory.
```bash
cp ./dist/global-citizens-network.bna .
```

2. Now we will use the admin card from the previous step to install the runtime with the following command:
```bash
composer runtime install -c adminCard -n global-citizens-network
```
>Note: If you get an error at this point, wait a minute and try again.

3. Start the business network by providing the admin card, the path to the .bna file, and the credentials received from the CA. This command will issue a card which we will remove, called ‘delete_me.card’.
```bash
composer network start -c adminCard -a events.bna -A admin -C ./credentials/admin-pub.pem -f delete_me.card
```
>Note: If you get an error at this point, wait a minute and try again.

4. Next, let’s delete delete_me.card :
```bash
rm delete_me.card
```

## 9. Create a new business network card

1. After we have installed the runtime and started the network, we need to create a card which we will deploy to the Starter Plan. Use the following command to create `adminCard.card`:
```bash
composer card create -n global-citizens-network -p connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem
```

2. Import the business network card:
```bash
composer card import -f ./admin@global-citizens-network.card
```

## 10. Create the composer-rest-server to interact with the business network

1. Install the composer-rest-server:
```bash
npm install -g composer-rest-server@0.18.1
```

2. Now, let’s start up the server. Make sure you are in the same directory as your `connection-profile.json`
```bash
composer-rest-server -c admin@global-citizens-network -n never -w true
```

3. In your browser, go to [http://localhost:3000/explorer](http://localhost:3000/explorer)

4. Now you can use the swagger api to perform operations in business network as shown in [Step 2]((#2-test-business-network-archive-usin-composer-playground))

## Extending Pattern

1. Add Network Permissions
2. Implement Dashboards
3. Implement logic for tracking payments default
4. Implement Notification logic
5. Improve transfer fund logic

## Additional Resources
* [Hyperledger Fabric Docs](http://hyperledger-fabric.readthedocs.io/en/latest/)
* [Hyperledger Composer Docs](https://hyperledger.github.io/composer/introduction/introduction.html)

## License
[Apache 2.0](LICENSE)
