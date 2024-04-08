import { BranchesOutlined, TagOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import {
  DirectionalHint,
  Icon,
  IShimmerElement,
  ITooltipHostStyles,
  SharedColors,
  Shimmer,
  ShimmerElementType,
  Stack,
  TooltipHost,
} from '@fluentui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ForeignLink } from '@johfe/perfsee-components'
import { GitHost } from '@johfe/perfsee-schema'
import { getCommitLink, hostDomains } from '@johfe/perfsee-shared'
import { pathFactory } from '@johfe/perfsee-shared/routes'

import { useProject, useProjectRouteGenerator } from '../../shared'

import { useAppVersion } from './use-app-version'

interface CommitTooltipProps {
  hash: string
}

const tooltipHostStyle: Partial<ITooltipHostStyles> = {
  root: { display: 'inline-flex', overflow: 'hidden' },
}

const Title = styled.span({
  fontSize: '16px',
  color: '#666',
  fontWeight: '600',
  wordBreak: 'break-all',
})

const Label = styled.span(({ theme }) => ({
  display: 'inline-block',
  border: `1px solid ${theme.border.color}`,
  borderRadius: theme.border.radius,
  padding: '2px 8px',
  fontSize: '14px',
  color: SharedColors.gray20,
}))

const Actions = styled(Stack)(({ theme }) => ({
  borderTop: `1px solid ${theme.border.color}`,
  paddingTop: '8px',
}))

const Information = styled.div({
  color: SharedColors.gray20,
})

const PrIcon = styled(BranchesOutlined)({
  transform: 'rotate(180deg)',
})

const titleShimmer: IShimmerElement[] = [
  { type: ShimmerElementType.line, height: 21 },
  { type: ShimmerElementType.gap, width: '8px' },
  { type: ShimmerElementType.line, height: 21, width: 100 },
]

const informanceShimmer: IShimmerElement[] = [
  { type: ShimmerElementType.line, height: 12, width: 12 },
  { type: ShimmerElementType.gap, width: '5px' },
  { type: ShimmerElementType.line, height: 12 },
]

const TooltipContent = ({ hash }: CommitTooltipProps) => {
  const project = useProject()!

  const { error, appVersion } = useAppVersion(hash)

  const generateProjectRoute = useProjectRouteGenerator()

  return error ? (
    <Stack tokens={{ childrenGap: 8 }}>
      <Title>{error}</Title>
    </Stack>
  ) : appVersion ? (
    <Stack tokens={{ childrenGap: 8 }}>
      <Stack horizontal verticalAlign="start" tokens={{ childrenGap: 8 }}>
        {appVersion.commitMessage ? (
          <>
            <Stack.Item shrink={0} grow={1}>
              <Title>{appVersion.commitMessage}</Title>
            </Stack.Item>
            <Stack.Item shrink={0} grow={0}>
              <Label>{hash.substring(0, 8)}</Label>
            </Stack.Item>
          </>
        ) : (
          <Stack.Item shrink={0} grow={1}>
            <Title>{hash}</Title>
          </Stack.Item>
        )}
      </Stack>
      <Information>
        {appVersion.branch && (
          <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <BranchesOutlined />
            <span>{appVersion.branch}</span>
          </Stack>
        )}
        {appVersion.version && (
          <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <TagOutlined />
            <span>{appVersion.version}</span>
          </Stack>
        )}
        {appVersion.pr && (
          <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <PrIcon />
            <span>#{appVersion.pr}</span>
          </Stack>
        )}
      </Information>
      <Actions horizontal tokens={{ childrenGap: 8 }} wrap>
        <ForeignLink href={getCommitLink(project, hash)}>
          {project.host !== GitHost.Unknown && (
            <>
              <Icon iconName="global" />
              &thinsp; Open Commit On {hostDomains[project.host]}
            </>
          )}
        </ForeignLink>
        <Link to={generateProjectRoute(pathFactory.project.source, { projectId: project.id }, { hash })}>
          {project.host !== GitHost.Unknown && (
            <>
              <Icon iconName="source" />
              &thinsp; Search Source Issues
            </>
          )}
        </Link>
      </Actions>
    </Stack>
  ) : (
    <Stack tokens={{ childrenGap: 8 }}>
      <Shimmer shimmerElements={titleShimmer} />
      <Shimmer width={100} shimmerElements={informanceShimmer} />
      <Shimmer width={100} shimmerElements={informanceShimmer} />
      <Shimmer width={100} shimmerElements={informanceShimmer} />
      <Actions tokens={{ childrenGap: 8 }}>
        <Shimmer />
      </Actions>
    </Stack>
  )
}

export const CommitTooltip = ({ children, hash }: React.PropsWithChildren<CommitTooltipProps>) => {
  const [open, setOpen] = useState(false)
  return (
    <TooltipHost
      styles={tooltipHostStyle}
      content={open ? <TooltipContent hash={hash} /> : <></>}
      directionalHint={DirectionalHint.bottomLeftEdge}
      calloutProps={{ isBeakVisible: false, calloutWidth: 600 }}
      onTooltipToggle={setOpen}
    >
      {children}
    </TooltipHost>
  )
}
