using RiskService from './risk-service';

annotate RiskService.Risks with {
	title       @title: 'Title';
	prio        @title: 'Priority';
	descr       @title: 'Description';
	miti        @title: 'Mitigation';
	impact      @title: 'Impact';
    bp          @title: 'Business Partner';
	status 		@title: 'Status'
}

annotate RiskService.Mitigations with {
	ID @(
		UI.Hidden,
		Common: {
		Text: description
		}
	);
	description  @title: 'Description';
	owner        @title: 'Owner';
	timeline     @title: 'Timeline';
	risks        @title: 'Risks';
}

annotate RiskService.Risks with @(
	UI: {
		HeaderInfo: {
			TypeName: 'Risk',
			TypeNamePlural: 'Risks',
			Title          : {
                $Type : 'UI.DataField',
                Value : title
            },
			Description : {
				$Type: 'UI.DataField',
				Value: descr
			}
		},
		SelectionFields: [prio, status_value],
		LineItem: [
			{Value: title},
			{Value: miti_ID},
			{Value: bp.businessPartnerFullName},
			{
				Value: prio,
				Criticality: criticality
			},
			{
				Value: impact,
				Criticality: criticality
			},
			{Value: status_value, Criticality: status.criticality}
		],
		Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Main', Target: '@UI.FieldGroup#Main'}
		],
		 HeaderFacets: [
             
             {$Type  : 'UI.ReferenceFacet', Target : '@UI.FieldGroup#Detail'}
            
        ],
		FieldGroup#Main: {
			Data: [
				{Value: miti_ID},
				{
					Value: prio,
					Criticality: criticality
				},
                {
					Value: impact,
					Criticality: criticality
				},
				{Value: bp_ID},
                {Value : bp.businessPartnerFullName},
                {Value : bp.businessPartnerIsBlocked},
                {Value : bp.searchTerm1},
				{Value : bp.industry},
				{Value: status_value, Criticality: status.criticality}
			]
		},
		FieldGroup #Detail : {Data : [
              {$Type: 'UI.DataField', Value: status_value, Title: 'Status', Criticality: status.criticality}
          ]}
	},
    Common.SideEffects : {
        EffectTypes      : #ValueChange,
        SourceProperties : [bp_ID],
        TargetProperties : [
            bp.businessPartnerFullName,
            bp.businessPartnerIsBlocked,
            bp.searchTerm1
        ]
    }
) {

};

annotate RiskService.Risks with {
	miti @(
		Common: {
			//show text, not id for mitigation in the context of risks
			Text: miti.description  , TextArrangement: #TextOnly,
			ValueList: {
				Label: 'Mitigations',
				CollectionPath: 'Mitigations',
				Parameters: [
					{ $Type: 'Common.ValueListParameterInOut',
						LocalDataProperty: miti_ID,
						ValueListProperty: 'ID'
					},
					{ $Type: 'Common.ValueListParameterDisplayOnly',
						ValueListProperty: 'description'
					}
				]
			}
		}
	);

	bp @(
		Common: {
			Text: bp.ID  , TextArrangement: #TextOnly,
			ValueList: {
				Label: 'Business Partners',
				CollectionPath: 'BusinessPartners',
				Parameters: [
					{ $Type: 'Common.ValueListParameterInOut',
						LocalDataProperty: bp_ID,
						ValueListProperty: 'ID'
					},
					{ $Type: 'Common.ValueListParameterDisplayOnly',
						ValueListProperty: 'businessPartnerFullName'
					},
					{ $Type: 'Common.ValueListParameterDisplayOnly',
						ValueListProperty: 'businessPartnerIsBlocked'
					},
                    { $Type: 'Common.ValueListParameterDisplayOnly',
						ValueListProperty: 'searchTerm1'
					}
				]
			}
		}
	);
}


  annotate RiskService.BusinessPartners with {
    // ID @(
    //   UI.Hidden,
    //   Common: {
    //     Text: businessPartnerFullName
    //   }
    // );
    ID @title: 'Business Partner';
    businessPartnerFullName    @title: 'Business Partner Name' @readonly;
    businessPartnerIsBlocked   @title: 'Blocked Status' @readonly;
    searchTerm1 @title: 'Search Term' @readonly;
	industry @title: 'Industry' @readonly;
  }

  annotate RiskService.StatusValues with {
   value @Common : {
        Text            : value,
        TextArrangement : #TextOnly
    } @title: 'status';
	 
};

annotate RiskService.Risks with {
    status @(
        Common: {
        ValueList: {entity: 'StatusValues'},
        ValueListWithFixedValues,
        FieldControl: #Mandatory
    }
    );
};

