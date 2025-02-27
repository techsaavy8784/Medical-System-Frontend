import "./searchPatientModal.html";

import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { patientHelpers } from '/imports/helpers/patientHelpers';
import { localsHelpers } from "/imports/helpers/localsHelpers";
import { remotesHelpers } from "/imports/helpers/remotesHelpers";

Template.searchPatientModal.onCreated( function searchModalOnCreated(){
	this.patientMrn = new ReactiveVar("");
	this.patientId = new ReactiveVar("");
	this.isValue = new ReactiveVar("");

});

Template.searchPatientModal.onRendered(function () {

	// const inputField = this.find('#patient-id');
	// console.log("inputField", inputField);
	// inputField.focus();
	// $('input').focus()
	$('#findLastName').focus();

	const searchPatientModal = this.find('#searchPatientModal');

	$(searchPatientModal).on('shown.bs.modal', function (event) {
		$('#findLastName').focus();
	});

	$(searchPatientModal).on('hidden.bs.modal', function (event) {
		// form.reset();
	});
});

Template.searchPatientModal.helpers({
	isLastName() {
		return Session.get("isLastName");
	},
	isUnique() {
		return (!!Template.instance().patientMrn.get() || !!Template.instance().patientId.get());
	},
	isMrn() {
		return (!!Template.instance().patientMrn.get());
	},
	isId() {
		return (!!Template.instance().patientId.get());
	},
	canInputMrn() {
		const inputValid = !!Template.instance().patientId.get() || !!Session.get("isLastName")
		return !inputValid;
	},
	canInputId() {
		const inputValid = !!Template.instance().patientMrn.get() || !!Session.get("isLastName")
		return !inputValid;
	}
});

Template.searchPatientModal.events({
	async "submit .search-patient-form"(event, instance) {
		event.preventDefault()
		$('#searchPatientModal').modal('hide');

		const target = event.target;
		const lastName = target?.lastName?.value?.toLowerCase();
		const firstName = target?.firstName?.value?.toLowerCase();
		const birthday = target?.birthday?.value;
		const id = target?.patientId?.value;
		
		if (!(lastName || firstName)) {
			return;
		}

		Session.set("isFindLoading", true);
		const isActive = Session.get("isActive");
		const authToken = Session.get("headers");
		const remote = remotesHelpers.getRemotes()[0];
		const local = localsHelpers.getLocals()[0];

		const coreUrl = () => {
			if (isActive === "remote") {
				return remote?.systems[0]?.coreUrl;
			} else {
				return local?.systems[0]?.coreUrl;
			}
		}
		let searchPatientQuery = "";
		const buildQuery = () => {
			if (id) {
				return `Patient?_id=${id}`;
			} else {
				if (lastName && firstName) {
				   if (!!birthday) {
					   searchPatientQuery = `family=${lastName}&given=${firstName}&birthdate=${birthday}`;
					   
					   return `Patient?${searchPatientQuery}`;
				   } else {
					   searchPatientQuery = `family=${lastName}&given=${firstName}`;
					   
					   return `Patient?${searchPatientQuery}`;
				   }
			   } else {
				   if (!!birthday) {
					   searchPatientQuery = `Patient?family=${lastName}&birthdate=${birthday}`;
					   
					   return `Patient?${searchPatientQuery}`;
				   } else {
					   searchPatientQuery = `family=${lastName}`;
					   
					   return `Patient?${searchPatientQuery}`;
				   }
			   }
			}
		}

		const res = await patientHelpers.getPatients(coreUrl(), buildQuery(), {
			Authorization: authToken,
		})
		console.log("res", res)
        
		Session.set("isFindLoading", false)

		if (!res.bundle?.entry?.length === true) {
			console.log("res", true)
			$('#searchPatientModal').modal('show');
		}

		if (isActive === "remote") {
            if (res.bundle) {
                Session.set("remoteSavedData", {
                    patients: res?.bundle?.entry,
                    cache: {
                        id: res?.queryId,
                        pageNumber: res?.pageNumber,
                        totalPages: res?.pageNumber,
                        countInPage: res?.countInPage,
                    },
					query: searchPatientQuery
                })
            } else {
                Session.set("remoteSavedData", null)
            }
		}  else {
            
            if (res?.bundle) {
            Session.set("localSavedData", {
                patients: res?.bundle?.entry,
                cache: {
                    id: res?.queryId,
                    pageNumber: res?.pageNumber,
                    totalPages: res?.pageNumber,
                    countInPage: res?.countInPage,
                },
				query: searchPatientQuery,
            })
            } else {
                Session.set("localSavedData", null)
            }
		}
		return false
	},
    'click .reset': function (event, instance) {
		event.preventDefault()
        Session.set("remoteSavedData", null)
        Session.set("localSavedData", null)
		Session.set("isLastName", false);
		instance.find('#findLastName').value = '';
		instance.find('#findFirstName').value = '';
		instance.find('[name="birthday"]').value = '';
		instance.find('#patient-mrn').value = '';
    },
	'input #findLastName'(event, instance) {
		const lastName = event.target.value;
		// Do something with the new value
		if (!!lastName) {
			Session.set("isLastName", true);
		} else {
			Session.set("isLastName", false);
		}
	},
	'input #patient-mrn'(event, instance) {
		const patientMrn = event.target.value;
		if (!!patientMrn) {
			instance.patientMrn.set(patientMrn);
		} else {
			instance.patientMrn.set("");
		}
	},
	'input #patient-id'(event, instance) {
		const patientId = event.target.value;
		if (!!patientId) {
			instance.patientId.set(patientId);
		} else {
			instance.patientId.set("");
		}
	},
	'input #findFirstName'(event, instance) {
		const firstName = event.target.value;
		
		if (!!firstName) {
			instance.isValue.set(firstName);
		} else {
			instance.isValue.set("");
		}
	},
	'input #birthday'(event, instance) {
		const birthDay = event.target.value;
		if (!!birthDay) {
			instance.isValue.set(birthDay);
		} else {
			instance.isValue.set("");
		}
	}
});