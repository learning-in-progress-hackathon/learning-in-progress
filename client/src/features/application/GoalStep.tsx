import { Chip } from './Chip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './Field'
import { MaterialInput } from './MaterialInput'
import { StepHeading } from './StepHeading'
import { goalTypes } from './profile'
import type { StepProps } from './ApplicationForm'

function GoalStep({ profile, update, errors }: StepProps) {
  return (
    <div>
      <StepHeading
        label="Your goal"
        hint="What you want to reach, and the material you’re working with."
      >
        What are you <em>working towards?</em>
      </StepHeading>

      <div className="flex flex-col gap-7">
        <Field label="What’s the goal?">
          <fieldset
            className="flex flex-wrap gap-2.5"
            aria-label="What’s the goal?"
          >
            {goalTypes.map((type) => (
              <Chip
                key={type}
                selected={profile.goalType === type}
                onClick={() =>
                  update({ goalType: profile.goalType === type ? '' : type })
                }
              >
                {type}
              </Chip>
            ))}
          </fieldset>
        </Field>

        <Field id="goal" label="Say it in your own words" optional>
          <Textarea
            id="goal"
            value={profile.goal}
            onChange={(e) => update({ goal: e.target.value })}
            placeholder="Pass my biology exam and actually understand cell biology, not just memorise it"
            className="min-h-20"
          />
        </Field>

        <hr className="border-t border-dashed border-rule" />

        <Field id="topic" label="What are you learning?" error={errors.topic}>
          <Input
            id="topic"
            value={profile.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder="Cell biology: membranes and transport"
            aria-invalid={!!errors.topic}
          />
        </Field>

        <Field
          label="Add your material"
          hint="Anything you’re learning from. You can add as much as you like, or skip this for now."
          optional
        >
          <MaterialInput profile={profile} update={update} />
        </Field>
      </div>
    </div>
  )
}

export { GoalStep }
