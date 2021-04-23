import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/InlineEditDataTableController.getAccounts';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    {   label: 'Name', fieldName: 'linkName',type: 'url',cellAttributes:{alignment: 'left'},sortable: true,
        typeAttributes: {label: { fieldName: 'Name' }, target: '_blank'}}, 
    {   label: 'Owner',fieldName: 'Owner.Name',type: 'text',editable: false,sortable: true}, 
    {   label: 'Website',fieldName: 'Website',type: 'text',editable: true,}, 
    {   label: 'Phone',fieldName: 'Phone',type: 'phone',editable: true,}, 
    {   label: 'AnnualRevenue',fieldName: 'AnnualRevenue',type: 'number',editable: true}
];

export default class InlineEditDataTable extends LightningElement 
{

    columns = columns;
    @track accounts;
    @track accountsBackup;
    @track error;
    saveDraftValues = [];
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    searchKey;

    @wire(getAccounts)
    wiredContacts({ error, data }) 
    {
        console.log('getAccountsdata112:'+JSON.stringify(data));
        if(data) 
        {
            this.error = undefined;
            this.accounts =  data.map(
                record => Object.assign(
                    { "Owner.Name": record.Owner.Name, "linkName": '/' + record.Id},record));

            this.accountsBackup = [...this.accounts];
            console.log('this.accountsBackup:'+JSON.stringify(this.accountsBackup));
        } 
        else if (error) 
        {
            this.error = error;
            this.accounts = undefined;
        }
    }

    handleSave(event) 
    {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'An Error Occured!!',
                    variant: 'error'
                })
            );
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }

    async refresh() 
    {
        await refreshApex(this.accounts);
    }

    sortBy(field, reverse, primer) 
    {
        const key = primer
            ? function(x) {
                  return primer(x[field]);
              }
            : function(x) {
                  return x[field];
              };

        return function(a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) 
    {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    handleKeywordChange(event)
    {
        var tempArray = [];
        this.searchKey = event.target.value; 
        console.log('this.searchKey:'+JSON.stringify(this.searchKey));
        for(var i=0;i<this.accountsBackup.length;i++)
        {
            if(this.accountsBackup[i].Name.includes(this.searchKey))
            {
                tempArray.push(this.accountsBackup[i]);
            }
        }
        this.accounts = [...tempArray];
        console.log('size:'+this.accounts.length);
    }
    
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;

    // Used to sort the 'Age' column
    sortBy(field, reverse, primer) 
    {
        const key = primer
            ? function(x) {
                  return primer(x[field]);
              }
            : function(x) {
                  return x[field];
              };

        return function(a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) 
    {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.accounts];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.accounts = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }
}