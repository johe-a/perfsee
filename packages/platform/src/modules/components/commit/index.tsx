import styled from '@emotion/styled'
import { SharedColors } from '@fluentui/theme'

import { ForeignLink } from '@fe/perfsee-components'
import { getCommitLink } from '@fe/perfsee-shared'

import { useProject } from '../../shared'

import { CommitTooltip } from './tooltip'

export interface CommitProps {
  hash: string
  commitMessage?: string | null
}

const Link = styled(ForeignLink)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'inline-block',
})

const CommitMessage = styled.span({
  color: SharedColors.gray20,
})

export const Commit = ({ hash, commitMessage }: CommitProps) => {
  const project = useProject()!

  return (
    <CommitTooltip hash={hash}>
      <Link href={getCommitLink(project, hash)}>
        {hash.substring(0, 8)}
        {commitMessage && <CommitMessage>&nbsp;|&nbsp;{commitMessage}</CommitMessage>}
      </Link>
    </CommitTooltip>
  )
}
