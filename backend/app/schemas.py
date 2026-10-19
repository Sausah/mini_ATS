import re
from marshmallow import Schema, fields, validate, validates, ValidationError, pre_load
from app.models import VALID_STAGES, VALID_SOURCES, VALID_EMPLOYMENT_TYPES, VALID_JOB_STATUSES


class JobSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    department = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    location = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    employment_type = fields.Str(
        load_default='Full-time',
        validate=validate.OneOf(VALID_EMPLOYMENT_TYPES)
    )
    description = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(
        load_default='Open',
        validate=validate.OneOf(VALID_JOB_STATUSES)
    )
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    candidate_count = fields.Int(dump_only=True)

    @pre_load
    def strip_strings(self, data, **kwargs):
        for key in ['title', 'department', 'location']:
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        return data


class StageHistorySchema(Schema):
    id = fields.Int(dump_only=True)
    candidate_id = fields.Int(dump_only=True)
    previous_stage = fields.Str(dump_only=True, allow_none=True)
    new_stage = fields.Str(dump_only=True)
    changed_at = fields.DateTime(dump_only=True)
    note = fields.Str(dump_only=True, allow_none=True)


class CandidateSchema(Schema):
    id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True)
    phone = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=20))
    job_id = fields.Int(load_default=None, allow_none=True)
    job_title = fields.Str(dump_only=True)
    stage = fields.Str(
        load_default='Applied',
        validate=validate.OneOf(VALID_STAGES)
    )
    resume_url = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=500))
    source = fields.Str(
        load_default='Other',
        validate=validate.OneOf(VALID_SOURCES)
    )
    notes = fields.Str(load_default=None, allow_none=True)
    applied_at = fields.DateTime(load_default=None, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    stage_history = fields.Nested(StageHistorySchema, many=True, dump_only=True)

    @pre_load
    def strip_strings(self, data, **kwargs):
        for key in ['full_name', 'email', 'phone']:
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        if 'email' in data and isinstance(data['email'], str):
            data['email'] = data['email'].lower()
        return data

    @validates('phone')
    def validate_phone(self, value):
        if value and not re.match(r'^[\d\s\+\-\(\)\.]{7,20}$', value):
            raise ValidationError('Invalid phone number format.')


class StageUpdateSchema(Schema):
    stage = fields.Str(required=True, validate=validate.OneOf(VALID_STAGES))
    note = fields.Str(load_default=None, allow_none=True)


job_schema = JobSchema()
jobs_schema = JobSchema(many=True)
candidate_schema = CandidateSchema()
candidates_schema = CandidateSchema(many=True)
stage_update_schema = StageUpdateSchema()
